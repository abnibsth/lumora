package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type CollabDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Begin(ctx context.Context) (pgx.Tx, error)
}

type CollaborationService struct {
	db       CollabDB
	notifSvc *NotificationService
}

func NewCollaborationService(db CollabDB, notifSvc *NotificationService) *CollaborationService {
	return &CollaborationService{db: db, notifSvc: notifSvc}
}

// -----------------------------------------------------------------------------
// 1. CREATE COLLABORATION REQUEST
// -----------------------------------------------------------------------------

func (s *CollaborationService) CreateRequest(ctx context.Context, sender domain.User, in domain.CreateCollaborationRequestInput) (domain.CollaborationRequest, error) {
	if err := in.Validate(); err != nil {
		return domain.CollaborationRequest{}, err
	}

	var businessID, partnerProfileID *string

	// Enforce directional integrity & auto-resolve target participants
	if in.Direction == domain.CollabDirectionPartnerToUMKM {
		if sender.Role != domain.RoleMitra {
			return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya akun Mitra yang dapat mengajukan arah kemitraan ke UMKM."}
		}
		if in.BusinessID == "" {
			return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Bisnis UMKM tujuan wajib dipilih."}
		}

		// Verify target business exists, is published, and resolve owner
		var bizOwnerID *string
		err := s.db.QueryRow(ctx, "SELECT owner_user_id FROM businesses WHERE id = $1 AND status = 'published'", in.BusinessID).Scan(&bizOwnerID)
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Profil bisnis UMKM tujuan tidak ditemukan atau belum dipublikasikan."}
		}
		if err != nil {
			return domain.CollaborationRequest{}, fmt.Errorf("check business: %w", err)
		}

		if bizOwnerID != nil && *bizOwnerID != "" {
			in.ReceiverUserID = *bizOwnerID
		} else {
			// Demo seed business fallback: assign to first registered UMKM/admin
			var fallbackID string
			_ = s.db.QueryRow(ctx, "SELECT id FROM users WHERE role = 'umkm' OR role = 'admin' ORDER BY created_at ASC LIMIT 1").Scan(&fallbackID)
			in.ReceiverUserID = fallbackID
		}
		businessID = &in.BusinessID

		// Auto-resolve sender partner profile ID
		var pID string
		err = s.db.QueryRow(ctx, "SELECT id FROM partner_profiles WHERE user_id = $1", sender.ID).Scan(&pID)
		if err == nil && pID != "" {
			partnerProfileID = &pID
		}
	} else if in.Direction == domain.CollabDirectionUMKMToPartner {
		if sender.Role != domain.RoleUMKM {
			return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya akun UMKM yang dapat mengajukan arah kemitraan ke Mitra."}
		}

		if in.ReceiverUserID == "" && in.PartnerProfileID != "" {
			var pUserID string
			err := s.db.QueryRow(ctx, "SELECT user_id FROM partner_profiles WHERE id = $1", in.PartnerProfileID).Scan(&pUserID)
			if err == nil && pUserID != "" {
				in.ReceiverUserID = pUserID
			}
		}

		// Auto-resolve receiver partner profile ID
		var pID string
		err := s.db.QueryRow(ctx, "SELECT id FROM partner_profiles WHERE user_id = $1", in.ReceiverUserID).Scan(&pID)
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Profil organisasi Mitra tujuan belum dikonfigurasi."}
		}
		if err != nil {
			return domain.CollaborationRequest{}, fmt.Errorf("check partner profile: %w", err)
		}
		partnerProfileID = &pID

		// Auto-resolve sender's published business
		if in.BusinessID != "" {
			var bOwnerID string
			err := s.db.QueryRow(ctx, "SELECT owner_user_id FROM businesses WHERE id = $1 AND status = 'published'", in.BusinessID).Scan(&bOwnerID)
			if err == nil && bOwnerID == sender.ID {
				businessID = &in.BusinessID
			}
		}
		if businessID == nil {
			var bID string
			err := s.db.QueryRow(ctx, "SELECT id FROM businesses WHERE owner_user_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 1", sender.ID).Scan(&bID)
			if err == nil && bID != "" {
				businessID = &bID
			}
		}
	}

	if sender.ID == in.ReceiverUserID {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Anda tidak dapat mengajukan kolaborasi ke akun Anda sendiri."}
	}

	// Verify receiver user exists and role
	var receiverRole, receiverName string
	err := s.db.QueryRow(ctx, "SELECT role, name FROM users WHERE id = $1", in.ReceiverUserID).Scan(&receiverRole, &receiverName)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Akun tujuan tidak ditemukan."}
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("check receiver: %w", err)
	}

	// Check for active pending request
	var pendingExists bool
	err = s.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM collaboration_requests
			WHERE sender_user_id = $1
			  AND receiver_user_id = $2
			  AND collaboration_type = $3
			  AND status = 'pending'
		)`, sender.ID, in.ReceiverUserID, in.CollaborationType).Scan(&pendingExists)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("check duplicate: %w", err)
	}
	if pendingExists {
		return domain.CollaborationRequest{}, &domain.ValidationError{
			Message: "Anda sudah memiliki pengajuan kolaborasi aktif untuk jenis kemitraan ini yang sedang menunggu respons.",
		}
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var reqID string
	var createdAt, updatedAt, expiresAt time.Time

	err = tx.QueryRow(ctx, `
		INSERT INTO collaboration_requests (
			sender_user_id, sender_role, receiver_user_id, receiver_role,
			business_id, partner_profile_id, direction, collaboration_type,
			title, message, proposal_detail, status, expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', now() + interval '30 days')
		RETURNING id, created_at, updated_at, expires_at`,
		sender.ID,
		sender.Role,
		in.ReceiverUserID,
		receiverRole,
		businessID,
		partnerProfileID,
		in.Direction,
		in.CollaborationType,
		in.Title,
		in.Message,
		in.ProposalDetail,
	).Scan(&reqID, &createdAt, &updatedAt, &expiresAt)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert collaboration request: %w", err)
	}

	// Insert event audit
	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, '', 'pending', 'Pengajuan kolaborasi dikirimkan')`,
		reqID, sender.ID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	// Trigger Notification to Receiver
	if s.notifSvc != nil {
		_ = s.notifSvc.Create(ctx, tx, in.ReceiverUserID, &sender.ID,
			domain.NotifTypeCollabCreated,
			"Pengajuan Kolaborasi Baru",
			fmt.Sprintf("%s mengirimkan pengajuan kolaborasi: \"%s\"", sender.Name, in.Title),
			domain.NotifTargetCollab, reqID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, sender.ID, reqID)
}

// -----------------------------------------------------------------------------
// 2. LIST INCOMING & OUTGOING REQUESTS
// -----------------------------------------------------------------------------

func (s *CollaborationService) ListIncoming(ctx context.Context, userID, status, search string, page, limit int) (domain.CollaborationRequestList, error) {
	return s.listRequests(ctx, userID, true, status, search, page, limit)
}

func (s *CollaborationService) ListOutgoing(ctx context.Context, userID, status, search string, page, limit int) (domain.CollaborationRequestList, error) {
	return s.listRequests(ctx, userID, false, status, search, page, limit)
}

func (s *CollaborationService) listRequests(ctx context.Context, userID string, isIncoming bool, status, search string, page, limit int) (domain.CollaborationRequestList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	baseWhere := "r.receiver_user_id = $1"
	if !isIncoming {
		baseWhere = "r.sender_user_id = $1"
	}

	query := `
		SELECT r.id, r.sender_user_id, us.name AS sender_name, r.sender_role,
		       r.receiver_user_id, ur.name AS receiver_name, r.receiver_role,
		       COALESCE(r.business_id::text, ''), COALESCE(b.name, ''), COALESCE(b.slug, ''),
		       COALESCE(b.category, ''), COALESCE(b.location, ''), COALESCE(b.cover_image, ''),
		       COALESCE(r.partner_profile_id::text, ''), COALESCE(p.company_name, ''),
		       COALESCE(p.partner_type, ''), COALESCE(p.logo, ''), COALESCE(p.location, ''),
		       r.direction, r.collaboration_type, r.title, r.message, r.proposal_detail,
		       r.status, COALESCE(c.id::text, ''), r.responded_at, r.expires_at,
		       r.created_at, r.updated_at
		FROM collaboration_requests r
		JOIN users us ON us.id = r.sender_user_id
		JOIN users ur ON ur.id = r.receiver_user_id
		LEFT JOIN businesses b ON b.id = r.business_id
		LEFT JOIN partner_profiles p ON p.id = r.partner_profile_id
		LEFT JOIN conversations c ON c.collaboration_request_id = r.id
		WHERE ` + baseWhere

	countQuery := `
		SELECT count(*)
		FROM collaboration_requests r
		JOIN users us ON us.id = r.sender_user_id
		JOIN users ur ON ur.id = r.receiver_user_id
		LEFT JOIN businesses b ON b.id = r.business_id
		LEFT JOIN partner_profiles p ON p.id = r.partner_profile_id
		WHERE ` + baseWhere

	args := []any{userID}
	argIdx := 2

	if status != "" && domain.ValidCollabStatus(status) {
		query += fmt.Sprintf(" AND r.status = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND r.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + search + "%"
		searchClause := fmt.Sprintf(` AND (r.title ILIKE $%d OR us.name ILIKE $%d OR ur.name ILIKE $%d OR b.name ILIKE $%d OR p.company_name ILIKE $%d)`,
			argIdx, argIdx, argIdx, argIdx, argIdx)
		query += searchClause
		countQuery += searchClause
		args = append(args, pattern)
		argIdx++
	}

	var total int64
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return domain.CollaborationRequestList{}, fmt.Errorf("count requests: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY r.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	offset := (page - 1) * limit
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return domain.CollaborationRequestList{}, fmt.Errorf("query requests: %w", err)
	}
	defer rows.Close()

	items := make([]domain.CollaborationRequest, 0)
	for rows.Next() {
		var req domain.CollaborationRequest
		err := rows.Scan(
			&req.ID, &req.SenderUserID, &req.SenderName, &req.SenderRole,
			&req.ReceiverUserID, &req.ReceiverName, &req.ReceiverRole,
			&req.BusinessID, &req.BusinessName, &req.BusinessSlug,
			&req.BusinessCategory, &req.BusinessLocation, &req.BusinessCoverImage,
			&req.PartnerProfileID, &req.PartnerCompanyName,
			&req.PartnerType, &req.PartnerLogo, &req.PartnerLocation,
			&req.Direction, &req.CollaborationType, &req.Title, &req.Message, &req.ProposalDetail,
			&req.Status, &req.ConversationID, &req.RespondedAt, &req.ExpiresAt,
			&req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			return domain.CollaborationRequestList{}, fmt.Errorf("scan request: %w", err)
		}
		if meta, ok := domain.MasterTaxonomyRegistry[req.CollaborationType]; ok {
			req.CollaborationTypeLabel = meta.PartnerSeek
		} else {
			req.CollaborationTypeLabel = req.CollaborationType
		}
		items = append(items, req)
	}

	return domain.CollaborationRequestList{
		Items: items,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// -----------------------------------------------------------------------------
// 3. STATS & DETAIL
// -----------------------------------------------------------------------------

func (s *CollaborationService) GetStats(ctx context.Context, userID string) (domain.CollaborationStats, error) {
	var stats domain.CollaborationStats
	err := s.db.QueryRow(ctx, `
		SELECT 
			count(*),
			count(*) FILTER (WHERE status = 'pending'),
			count(*) FILTER (WHERE status = 'accepted'),
			count(*) FILTER (WHERE status = 'rejected')
		FROM collaboration_requests
		WHERE receiver_user_id = $1 OR sender_user_id = $1`, userID).Scan(
		&stats.Total,
		&stats.Pending,
		&stats.Accepted,
		&stats.Rejected,
	)
	if err != nil {
		return domain.CollaborationStats{}, fmt.Errorf("query stats: %w", err)
	}
	return stats, nil
}

func (s *CollaborationService) GetRequestByID(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	var req domain.CollaborationRequest
	err := s.db.QueryRow(ctx, `
		SELECT r.id, r.sender_user_id, us.name, r.sender_role,
		       r.receiver_user_id, ur.name, r.receiver_role,
		       COALESCE(r.business_id::text, ''), COALESCE(b.name, ''), COALESCE(b.slug, ''),
		       COALESCE(b.category, ''), COALESCE(b.location, ''), COALESCE(b.cover_image, ''),
		       COALESCE(r.partner_profile_id::text, ''), COALESCE(p.company_name, ''),
		       COALESCE(p.partner_type, ''), COALESCE(p.logo, ''), COALESCE(p.location, ''),
		       r.direction, r.collaboration_type, r.title, r.message, r.proposal_detail,
		       r.status, COALESCE(c.id::text, ''), r.responded_at, r.expires_at,
		       r.created_at, r.updated_at
		FROM collaboration_requests r
		JOIN users us ON us.id = r.sender_user_id
		JOIN users ur ON ur.id = r.receiver_user_id
		LEFT JOIN businesses b ON b.id = r.business_id
		LEFT JOIN partner_profiles p ON p.id = r.partner_profile_id
		LEFT JOIN conversations c ON c.collaboration_request_id = r.id
		WHERE r.id = $1`, requestID).Scan(
		&req.ID, &req.SenderUserID, &req.SenderName, &req.SenderRole,
		&req.ReceiverUserID, &req.ReceiverName, &req.ReceiverRole,
		&req.BusinessID, &req.BusinessName, &req.BusinessSlug,
		&req.BusinessCategory, &req.BusinessLocation, &req.BusinessCoverImage,
		&req.PartnerProfileID, &req.PartnerCompanyName,
		&req.PartnerType, &req.PartnerLogo, &req.PartnerLocation,
		&req.Direction, &req.CollaborationType, &req.Title, &req.Message, &req.ProposalDetail,
		&req.Status, &req.ConversationID, &req.RespondedAt, &req.ExpiresAt,
		&req.CreatedAt, &req.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("get request: %w", err)
	}

	// Authorization: only sender or receiver may view
	if req.SenderUserID != userID && req.ReceiverUserID != userID {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}

	if meta, ok := domain.MasterTaxonomyRegistry[req.CollaborationType]; ok {
		req.CollaborationTypeLabel = meta.PartnerSeek
	} else {
		req.CollaborationTypeLabel = req.CollaborationType
	}

	return req, nil
}

// -----------------------------------------------------------------------------
// 4. STATUS TRANSITIONS & INBOX CREATION
// -----------------------------------------------------------------------------

func (s *CollaborationService) AcceptRequest(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, receiverID, status, title string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, status, title
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &receiverID, &status, &title)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	// Authorization: only receiver may accept
	if receiverID != userID {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya penerima pengajuan yang berhak menerima kolaborasi."}
	}
	if status != domain.CollabStatusPending {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Permintaan kolaborasi tidak dapat diterima karena status sudah bukan menunggu."}
	}

	// Update status to accepted
	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'accepted', responded_at = now(), updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	// Record audit event
	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, 'pending', 'accepted', 'Pengajuan kolaborasi diterima')`,
		requestID, userID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	// TRANSACTIONAL INBOX CONVERSATION PROVISIONING
	var convID string
	err = tx.QueryRow(ctx, `
		INSERT INTO conversations (collaboration_request_id, created_at, updated_at)
		VALUES ($1, now(), now())
		ON CONFLICT (collaboration_request_id) DO UPDATE SET updated_at = now()
		RETURNING id`, requestID).Scan(&convID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("create conversation: %w", err)
	}

	// Add participants (sender and receiver)
	_, err = tx.Exec(ctx, `
		INSERT INTO conversation_participants (conversation_id, user_id)
		VALUES ($1, $2), ($1, $3)
		ON CONFLICT DO NOTHING`, convID, senderID, receiverID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("add participants: %w", err)
	}

	// System initial greeting message
	_, err = tx.Exec(ctx, `
		INSERT INTO messages (conversation_id, sender_id, content)
		VALUES ($1, $2, 'Permintaan kolaborasi telah disetujui. Jalur komunikasi resmi kini telah dibuka.')`,
		convID, userID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("initial message: %w", err)
	}

	// Trigger Notification to Sender
	if s.notifSvc != nil {
		var receiverName string
		_ = tx.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&receiverName)
		_ = s.notifSvc.Create(ctx, tx, senderID, &userID,
			domain.NotifTypeCollabAccepted,
			"Pengajuan Kolaborasi Diterima",
			fmt.Sprintf("Pengajuan kolaborasi \"%s\" telah disetujui oleh %s. Ruang percakapan Inbox kini telah dibuka.", title, receiverName),
			domain.NotifTargetConversation, convID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

func (s *CollaborationService) RejectRequest(ctx context.Context, userID, requestID, reason string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, receiverID, status, title string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, status, title
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &receiverID, &status, &title)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	// Authorization: only receiver may reject
	if receiverID != userID {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya penerima pengajuan yang berhak menolak kolaborasi."}
	}
	if status != domain.CollabStatusPending {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Permintaan kolaborasi tidak dapat ditolak karena status sudah bukan menunggu."}
	}

	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'rejected', responded_at = now(), updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, 'pending', 'rejected', $3)`,
		requestID, userID, strings.TrimSpace(reason))
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	// Trigger Notification to Sender
	if s.notifSvc != nil {
		var receiverName string
		_ = tx.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&receiverName)
		_ = s.notifSvc.Create(ctx, tx, senderID, &userID,
			domain.NotifTypeCollabRejected,
			"Pengajuan Kolaborasi Ditolak",
			fmt.Sprintf("Pengajuan kolaborasi \"%s\" ditolak oleh %s.", title, receiverName),
			domain.NotifTargetCollab, requestID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

func (s *CollaborationService) WithdrawRequest(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, status string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, status
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &status)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	// Authorization: only sender may withdraw
	if senderID != userID {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya pengirim pengajuan yang berhak menarik kolaborasi."}
	}
	if status != domain.CollabStatusPending {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Permintaan kolaborasi tidak dapat ditarik karena status sudah bukan menunggu."}
	}

	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'withdrawn', updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, 'pending', 'withdrawn', 'Pengajuan ditarik oleh pengirim')`,
		requestID, userID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

// -----------------------------------------------------------------------------
// 5. PARTNERSHIP PROGRESS LIFECYCLE (Start, Complete, Cancel)
// -----------------------------------------------------------------------------

func (s *CollaborationService) StartPartnership(ctx context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, receiverID, status, title string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, status, title
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &receiverID, &status, &title)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	if senderID != userID && receiverID != userID {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if status != domain.CollabStatusAccepted {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya pengajuan yang telah disetujui yang dapat dimulai kemitraannya."}
	}

	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'in_progress', updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, 'accepted', 'in_progress', 'Pelaksanaan kemitraan resmi dimulai')`,
		requestID, userID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	// Notify other party
	otherID := senderID
	if userID == senderID {
		otherID = receiverID
	}
	if s.notifSvc != nil {
		var actorName string
		_ = tx.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&actorName)
		_ = s.notifSvc.Create(ctx, tx, otherID, &userID,
			domain.NotifTypeCollabStarted,
			"Kemitraan Resmi Dimulai",
			fmt.Sprintf("Pelaksanaan kemitraan \"%s\" resmi dimulai bersama %s.", title, actorName),
			domain.NotifTargetHistory, requestID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

func (s *CollaborationService) CompletePartnership(ctx context.Context, userID, requestID, notes string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, receiverID, status, title string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, status, title
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &receiverID, &status, &title)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	if senderID != userID && receiverID != userID {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if status != domain.CollabStatusInProgress && status != domain.CollabStatusAccepted {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya kemitraan yang sedang berlangsung atau disetujui yang dapat diselesaikan."}
	}

	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'completed', updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	reason := "Kemitraan telah selesai dijalankan dengan sukses"
	if strings.TrimSpace(notes) != "" {
		reason = strings.TrimSpace(notes)
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, $3, 'completed', $4)`,
		requestID, userID, status, reason)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	otherID := senderID
	if userID == senderID {
		otherID = receiverID
	}
	if s.notifSvc != nil {
		var actorName string
		_ = tx.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&actorName)
		_ = s.notifSvc.Create(ctx, tx, otherID, &userID,
			domain.NotifTypeCollabCompleted,
			"Kemitraan Telah Selesai",
			fmt.Sprintf("Kemitraan \"%s\" telah dinyatakan selesai oleh %s.", title, actorName),
			domain.NotifTargetHistory, requestID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

func (s *CollaborationService) CancelPartnership(ctx context.Context, userID, requestID, reason string) (domain.CollaborationRequest, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var senderID, receiverID, status, title string
	err = tx.QueryRow(ctx, `
		SELECT sender_user_id, receiver_user_id, status, title
		FROM collaboration_requests
		WHERE id = $1
		FOR UPDATE`, requestID).Scan(&senderID, &receiverID, &status, &title)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("lock request: %w", err)
	}

	if senderID != userID && receiverID != userID {
		return domain.CollaborationRequest{}, domain.ErrNotFound
	}
	if status != domain.CollabStatusAccepted && status != domain.CollabStatusInProgress {
		return domain.CollaborationRequest{}, &domain.ValidationError{Message: "Hanya kemitraan yang telah disetujui atau sedang berlangsung yang dapat dibatalkan."}
	}

	_, err = tx.Exec(ctx, `
		UPDATE collaboration_requests
		SET status = 'cancelled', updated_at = now()
		WHERE id = $1`, requestID)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("update status: %w", err)
	}

	cancelReason := "Kemitraan dibatalkan"
	if strings.TrimSpace(reason) != "" {
		cancelReason = strings.TrimSpace(reason)
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO collaboration_request_events (request_id, actor_user_id, from_status, to_status, reason)
		VALUES ($1, $2, $3, 'cancelled', $4)`,
		requestID, userID, status, cancelReason)
	if err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("insert event: %w", err)
	}

	otherID := senderID
	if userID == senderID {
		otherID = receiverID
	}
	if s.notifSvc != nil {
		var actorName string
		_ = tx.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", userID).Scan(&actorName)
		_ = s.notifSvc.Create(ctx, tx, otherID, &userID,
			domain.NotifTypeCollabCancelled,
			"Kemitraan Dibatalkan",
			fmt.Sprintf("Kemitraan \"%s\" telah dibatalkan oleh %s.", title, actorName),
			domain.NotifTargetHistory, requestID)
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.CollaborationRequest{}, fmt.Errorf("commit tx: %w", err)
	}

	return s.GetRequestByID(ctx, userID, requestID)
}

// -----------------------------------------------------------------------------
// 6. PARTNERSHIP HISTORY & TIMELINE QUERIES
// -----------------------------------------------------------------------------

func (s *CollaborationService) ListHistory(ctx context.Context, userID, status, search, startDate, endDate string, page, limit int) (domain.CollaborationRequestList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	baseWhere := "(r.sender_user_id = $1 OR r.receiver_user_id = $1)"

	query := `
		SELECT r.id, r.sender_user_id, us.name AS sender_name, r.sender_role,
		       r.receiver_user_id, ur.name AS receiver_name, r.receiver_role,
		       COALESCE(r.business_id::text, ''), COALESCE(b.name, ''), COALESCE(b.slug, ''),
		       COALESCE(b.category, ''), COALESCE(b.location, ''), COALESCE(b.cover_image, ''),
		       COALESCE(r.partner_profile_id::text, ''), COALESCE(p.company_name, ''),
		       COALESCE(p.partner_type, ''), COALESCE(p.logo, ''), COALESCE(p.location, ''),
		       r.direction, r.collaboration_type, r.title, r.message, r.proposal_detail,
		       r.status, COALESCE(c.id::text, ''), r.responded_at, r.expires_at,
		       r.created_at, r.updated_at
		FROM collaboration_requests r
		JOIN users us ON us.id = r.sender_user_id
		JOIN users ur ON ur.id = r.receiver_user_id
		LEFT JOIN businesses b ON b.id = r.business_id
		LEFT JOIN partner_profiles p ON p.id = r.partner_profile_id
		LEFT JOIN conversations c ON c.collaboration_request_id = r.id
		WHERE ` + baseWhere

	countQuery := `
		SELECT count(*)
		FROM collaboration_requests r
		JOIN users us ON us.id = r.sender_user_id
		JOIN users ur ON ur.id = r.receiver_user_id
		LEFT JOIN businesses b ON b.id = r.business_id
		LEFT JOIN partner_profiles p ON p.id = r.partner_profile_id
		WHERE ` + baseWhere

	args := []any{userID}
	argIdx := 2

	if status != "" && domain.ValidCollabStatus(status) {
		query += fmt.Sprintf(" AND r.status = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND r.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	search = strings.TrimSpace(search)
	if search != "" {
		pattern := "%" + search + "%"
		clause := fmt.Sprintf(` AND (r.title ILIKE $%d OR us.name ILIKE $%d OR ur.name ILIKE $%d OR b.name ILIKE $%d OR p.company_name ILIKE $%d)`,
			argIdx, argIdx, argIdx, argIdx, argIdx)
		query += clause
		countQuery += clause
		args = append(args, pattern)
		argIdx++
	}

	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query += fmt.Sprintf(" AND r.created_at >= $%d", argIdx)
			countQuery += fmt.Sprintf(" AND r.created_at >= $%d", argIdx)
			args = append(args, t)
			argIdx++
		}
	}

	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			// end of day
			t = t.Add(24 * time.Hour)
			query += fmt.Sprintf(" AND r.created_at < $%d", argIdx)
			countQuery += fmt.Sprintf(" AND r.created_at < $%d", argIdx)
			args = append(args, t)
			argIdx++
		}
	}

	var total int64
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return domain.CollaborationRequestList{}, fmt.Errorf("count history: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY r.updated_at DESC, r.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	offset := (page - 1) * limit
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return domain.CollaborationRequestList{}, fmt.Errorf("query history: %w", err)
	}
	defer rows.Close()

	items := make([]domain.CollaborationRequest, 0)
	for rows.Next() {
		var req domain.CollaborationRequest
		err := rows.Scan(
			&req.ID, &req.SenderUserID, &req.SenderName, &req.SenderRole,
			&req.ReceiverUserID, &req.ReceiverName, &req.ReceiverRole,
			&req.BusinessID, &req.BusinessName, &req.BusinessSlug,
			&req.BusinessCategory, &req.BusinessLocation, &req.BusinessCoverImage,
			&req.PartnerProfileID, &req.PartnerCompanyName,
			&req.PartnerType, &req.PartnerLogo, &req.PartnerLocation,
			&req.Direction, &req.CollaborationType, &req.Title, &req.Message, &req.ProposalDetail,
			&req.Status, &req.ConversationID, &req.RespondedAt, &req.ExpiresAt,
			&req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			return domain.CollaborationRequestList{}, fmt.Errorf("scan history item: %w", err)
		}
		if meta, ok := domain.MasterTaxonomyRegistry[req.CollaborationType]; ok {
			req.CollaborationTypeLabel = meta.PartnerSeek
		} else {
			req.CollaborationTypeLabel = req.CollaborationType
		}
		items = append(items, req)
	}

	return domain.CollaborationRequestList{
		Items: items,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *CollaborationService) GetHistoryStats(ctx context.Context, userID string) (domain.CollaborationHistoryStats, error) {
	var stats domain.CollaborationHistoryStats
	err := s.db.QueryRow(ctx, `
		SELECT 
			count(*),
			count(*) FILTER (WHERE status = 'pending'),
			count(*) FILTER (WHERE status = 'accepted'),
			count(*) FILTER (WHERE status = 'in_progress'),
			count(*) FILTER (WHERE status = 'completed'),
			count(*) FILTER (WHERE status = 'rejected'),
			count(*) FILTER (WHERE status = 'cancelled' OR status = 'withdrawn')
		FROM collaboration_requests
		WHERE receiver_user_id = $1 OR sender_user_id = $1`, userID).Scan(
		&stats.Total,
		&stats.Pending,
		&stats.Accepted,
		&stats.InProgress,
		&stats.Completed,
		&stats.Rejected,
		&stats.Cancelled,
	)
	if err != nil {
		return domain.CollaborationHistoryStats{}, fmt.Errorf("query history stats: %w", err)
	}
	return stats, nil
}

func (s *CollaborationService) GetHistoryDetail(ctx context.Context, userID, requestID string) (domain.CollaborationHistoryDetail, error) {
	req, err := s.GetRequestByID(ctx, userID, requestID)
	if err != nil {
		return domain.CollaborationHistoryDetail{}, err
	}

	query := `
		SELECT e.id, e.request_id, e.actor_user_id, COALESCE(u.name, ''), COALESCE(u.role, ''),
		       e.from_status, e.to_status, e.reason, e.created_at
		FROM collaboration_request_events e
		LEFT JOIN users u ON u.id = e.actor_user_id
		WHERE e.request_id = $1
		ORDER BY e.created_at ASC`

	rows, err := s.db.Query(ctx, query, requestID)
	if err != nil {
		return domain.CollaborationHistoryDetail{}, fmt.Errorf("query events: %w", err)
	}
	defer rows.Close()

	events := make([]domain.CollaborationEvent, 0)
	for rows.Next() {
		var ev domain.CollaborationEvent
		err := rows.Scan(
			&ev.ID, &ev.RequestID, &ev.ActorUserID, &ev.ActorName, &ev.ActorRole,
			&ev.FromStatus, &ev.ToStatus, &ev.Reason, &ev.CreatedAt,
		)
		if err != nil {
			return domain.CollaborationHistoryDetail{}, fmt.Errorf("scan event: %w", err)
		}
		events = append(events, ev)
	}

	return domain.CollaborationHistoryDetail{
		Request: req,
		Events:  events,
	}, nil
}

// -----------------------------------------------------------------------------
// 7. INBOX & MESSAGING
// -----------------------------------------------------------------------------

func (s *CollaborationService) ListConversations(ctx context.Context, userID string) ([]domain.Conversation, error) {
	query := `
		SELECT c.id, c.collaboration_request_id, r.title, r.collaboration_type,
		       u_other.id, u_other.name, u_other.role,
		       COALESCE(p.logo, b.logo, ''),
		       c.created_at, c.updated_at,
		       (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.read_at IS NULL) AS unread_count,
		       m_last.id, m_last.sender_id, u_sender.name, m_last.content, m_last.read_at, m_last.created_at
		FROM conversations c
		JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
		JOIN collaboration_requests r ON r.id = c.collaboration_request_id
		JOIN conversation_participants cp_other ON cp_other.conversation_id = c.id AND cp_other.user_id != $1
		JOIN users u_other ON u_other.id = cp_other.user_id
		LEFT JOIN partner_profiles p ON p.user_id = u_other.id
		LEFT JOIN businesses b ON b.owner_user_id = u_other.id AND b.status = 'published'
		LEFT JOIN LATERAL (
			SELECT m.id, m.sender_id, m.content, m.read_at, m.created_at
			FROM messages m
			WHERE m.conversation_id = c.id
			ORDER BY m.created_at DESC
			LIMIT 1
		) m_last ON true
		LEFT JOIN users u_sender ON u_sender.id = m_last.sender_id
		WHERE r.status IN ('accepted', 'in_progress', 'completed')
		ORDER BY c.updated_at DESC
	`

	rows, err := s.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query conversations: %w", err)
	}
	defer rows.Close()

	items := make([]domain.Conversation, 0)
	for rows.Next() {
		var conv domain.Conversation
		var lastID, lastSenderID, lastSenderName, lastContent *string
		var lastReadAt, lastCreatedAt *time.Time

		err := rows.Scan(
			&conv.ID, &conv.CollaborationRequestID, &conv.RequestTitle, &conv.CollaborationType,
			&conv.OtherParticipantID, &conv.OtherParticipantName, &conv.OtherParticipantRole,
			&conv.OtherParticipantAvatar, &conv.CreatedAt, &conv.UpdatedAt, &conv.UnreadCount,
			&lastID, &lastSenderID, &lastSenderName, &lastContent, &lastReadAt, &lastCreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan conversation: %w", err)
		}

		if meta, ok := domain.MasterTaxonomyRegistry[conv.CollaborationType]; ok {
			conv.CollaborationTypeLabel = meta.PartnerSeek
		} else {
			conv.CollaborationTypeLabel = conv.CollaborationType
		}

		if lastID != nil && lastContent != nil {
			conv.LastMessage = &domain.Message{
				ID:             *lastID,
				ConversationID: conv.ID,
				SenderID:       *lastSenderID,
				SenderName:     *lastSenderName,
				Content:        *lastContent,
				ReadAt:         lastReadAt,
				CreatedAt:      *lastCreatedAt,
			}
		}

		items = append(items, conv)
	}

	return items, nil
}

func (s *CollaborationService) GetMessages(ctx context.Context, userID, conversationID string, page, limit int) (domain.MessageList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	// Verify user is a participant
	var isParticipant bool
	err := s.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM conversation_participants
			WHERE conversation_id = $1 AND user_id = $2
		)`, conversationID, userID).Scan(&isParticipant)
	if err != nil {
		return domain.MessageList{}, fmt.Errorf("check participant: %w", err)
	}
	if !isParticipant {
		return domain.MessageList{}, domain.ErrNotFound
	}

	// Mark unread messages from other user as read
	_, _ = s.db.Exec(ctx, `
		UPDATE messages
		SET read_at = now()
		WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL`, conversationID, userID)

	var total int64
	err = s.db.QueryRow(ctx, "SELECT count(*) FROM messages WHERE conversation_id = $1", conversationID).Scan(&total)
	if err != nil {
		return domain.MessageList{}, fmt.Errorf("count messages: %w", err)
	}

	offset := (page - 1) * limit
	rows, err := s.db.Query(ctx, `
		SELECT m.id, m.conversation_id, m.sender_id, u.name, m.content, m.read_at, m.created_at
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.conversation_id = $1
		ORDER BY m.created_at ASC
		LIMIT $2 OFFSET $3`, conversationID, limit, offset)
	if err != nil {
		return domain.MessageList{}, fmt.Errorf("query messages: %w", err)
	}
	defer rows.Close()

	items := make([]domain.Message, 0)
	for rows.Next() {
		var m domain.Message
		err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.SenderName, &m.Content, &m.ReadAt, &m.CreatedAt)
		if err != nil {
			return domain.MessageList{}, fmt.Errorf("scan message: %w", err)
		}
		items = append(items, m)
	}

	return domain.MessageList{
		Items: items,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func (s *CollaborationService) SendMessage(ctx context.Context, sender domain.User, conversationID string, in domain.SendMessageInput) (domain.Message, error) {
	if err := in.Validate(); err != nil {
		return domain.Message{}, err
	}

	// Verify conversation exists and request is accepted/in_progress/completed
	var collabStatus, reqID string
	err := s.db.QueryRow(ctx, `
		SELECT r.status, r.id
		FROM conversations c
		JOIN collaboration_requests r ON r.id = c.collaboration_request_id
		JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
		WHERE c.id = $2`, sender.ID, conversationID).Scan(&collabStatus, &reqID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Message{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.Message{}, fmt.Errorf("verify conversation: %w", err)
	}

	if collabStatus != domain.CollabStatusAccepted && collabStatus != domain.CollabStatusInProgress && collabStatus != domain.CollabStatusCompleted {
		return domain.Message{}, &domain.ValidationError{Message: "Percakapan belum aktif karena pengajuan kolaborasi belum disetujui."}
	}

	var msgID string
	var createdAt time.Time
	err = s.db.QueryRow(ctx, `
		INSERT INTO messages (conversation_id, sender_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`, conversationID, sender.ID, in.Content).Scan(&msgID, &createdAt)
	if err != nil {
		return domain.Message{}, fmt.Errorf("insert message: %w", err)
	}

	// Update conversation updated_at
	_, _ = s.db.Exec(ctx, "UPDATE conversations SET updated_at = now() WHERE id = $1", conversationID)

	// Trigger Notification to other participant
	if s.notifSvc != nil {
		var recipientID string
		_ = s.db.QueryRow(ctx, "SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2 LIMIT 1", conversationID, sender.ID).Scan(&recipientID)
		if recipientID != "" {
			snippet := in.Content
			if len(snippet) > 80 {
				snippet = snippet[:80] + "..."
			}
			_ = s.notifSvc.Create(ctx, nil, recipientID, &sender.ID,
				domain.NotifTypeNewMessage,
				fmt.Sprintf("Pesan Baru dari %s", sender.Name),
				snippet,
				domain.NotifTargetConversation, conversationID)
		}
	}

	return domain.Message{
		ID:             msgID,
		ConversationID: conversationID,
		SenderID:       sender.ID,
		SenderName:     sender.Name,
		Content:        in.Content,
		CreatedAt:      createdAt,
	}, nil
}
