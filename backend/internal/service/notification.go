package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/alfian/lumora/backend/internal/domain"
)

type NotificationDB interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

type NotificationService struct {
	db NotificationDB
}

func NewNotificationService(db NotificationDB) *NotificationService {
	return &NotificationService{db: db}
}

// Create inserts a notification. If tx is non-nil, it runs inside the transaction.
// It never notifies the actor themselves.
func (s *NotificationService) Create(ctx context.Context, tx pgx.Tx, recipientID string, actorID *string, notifType, title, body, targetType, targetID string) error {
	if recipientID == "" {
		return nil
	}
	if actorID != nil && *actorID == recipientID {
		return nil
	}

	query := `
		INSERT INTO notifications (
			recipient_user_id, actor_user_id, type, title, body, target_type, target_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	var err error
	if tx != nil {
		_, err = tx.Exec(ctx, query, recipientID, actorID, notifType, title, body, targetType, targetID)
	} else {
		_, err = s.db.Exec(ctx, query, recipientID, actorID, notifType, title, body, targetType, targetID)
	}

	if err != nil {
		return fmt.Errorf("create notification: %w", err)
	}
	return nil
}

func (s *NotificationService) List(ctx context.Context, userID, filterType string, unreadOnly bool, page, limit int) (domain.NotificationList, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 50 {
		limit = 50
	}

	var unreadCount int64
	err := s.db.QueryRow(ctx, "SELECT count(*) FROM notifications WHERE recipient_user_id = $1 AND read_at IS NULL", userID).Scan(&unreadCount)
	if err != nil {
		return domain.NotificationList{}, fmt.Errorf("count unread: %w", err)
	}

	query := `
		SELECT n.id, n.recipient_user_id, n.actor_user_id,
		       COALESCE(u.name, ''), COALESCE(u.role, ''),
		       COALESCE(p.logo, b.logo, ''),
		       n.type, n.title, n.body, n.target_type, n.target_id,
		       n.read_at, n.created_at
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_user_id
		LEFT JOIN partner_profiles p ON p.user_id = n.actor_user_id
		LEFT JOIN businesses b ON b.owner_user_id = n.actor_user_id AND b.status = 'published'
		WHERE n.recipient_user_id = $1`

	countQuery := `SELECT count(*) FROM notifications n WHERE n.recipient_user_id = $1`

	args := []any{userID}
	argIdx := 2

	if unreadOnly {
		query += fmt.Sprintf(" AND n.read_at IS NULL")
		countQuery += fmt.Sprintf(" AND n.read_at IS NULL")
	}

	filterType = strings.TrimSpace(filterType)
	if filterType == "collaboration" {
		query += fmt.Sprintf(" AND n.type LIKE 'collab_%%'")
		countQuery += fmt.Sprintf(" AND n.type LIKE 'collab_%%'")
	} else if filterType == "message" {
		query += fmt.Sprintf(" AND n.type = 'new_message'")
		countQuery += fmt.Sprintf(" AND n.type = 'new_message'")
	} else if filterType == "system" {
		query += fmt.Sprintf(" AND n.type = 'system'")
		countQuery += fmt.Sprintf(" AND n.type = 'system'")
	}

	var total int64
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return domain.NotificationList{}, fmt.Errorf("count notifications: %w", err)
	}

	query += fmt.Sprintf(" ORDER BY n.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	offset := (page - 1) * limit
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return domain.NotificationList{}, fmt.Errorf("query notifications: %w", err)
	}
	defer rows.Close()

	items := make([]domain.Notification, 0)
	for rows.Next() {
		var n domain.Notification
		var actorID *string
		var readAt *time.Time
		err := rows.Scan(
			&n.ID, &n.RecipientUserID, &actorID,
			&n.ActorName, &n.ActorRole, &n.ActorAvatar,
			&n.Type, &n.Title, &n.Body, &n.TargetType, &n.TargetID,
			&readAt, &n.CreatedAt,
		)
		if err != nil {
			return domain.NotificationList{}, fmt.Errorf("scan notification: %w", err)
		}
		n.ActorUserID = actorID
		n.ReadAt = readAt
		items = append(items, n)
	}

	return domain.NotificationList{
		Items:       items,
		Total:       total,
		UnreadCount: unreadCount,
		Page:        page,
		Limit:       limit,
	}, nil
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	var count int64
	err := s.db.QueryRow(ctx, "SELECT count(*) FROM notifications WHERE recipient_user_id = $1 AND read_at IS NULL", userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("get unread count: %w", err)
	}
	return count, nil
}

func (s *NotificationService) MarkRead(ctx context.Context, userID, notifID string) error {
	_, err := s.db.Exec(ctx, "UPDATE notifications SET read_at = now() WHERE id = $1 AND recipient_user_id = $2 AND read_at IS NULL", notifID, userID)
	if err != nil {
		return fmt.Errorf("mark notification read: %w", err)
	}
	return nil
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	_, err := s.db.Exec(ctx, "UPDATE notifications SET read_at = now() WHERE recipient_user_id = $1 AND read_at IS NULL", userID)
	if err != nil {
		return fmt.Errorf("mark all read: %w", err)
	}
	return nil
}

