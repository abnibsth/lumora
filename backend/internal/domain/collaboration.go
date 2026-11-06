package domain

import (
	"fmt"
	"strings"
	"time"
)

const (
	CollabStatusPending   = "pending"
	CollabStatusAccepted  = "accepted"
	CollabStatusRejected  = "rejected"
	CollabStatusWithdrawn = "withdrawn"
	CollabStatusExpired   = "expired"

	CollabDirectionPartnerToUMKM = "partner_to_umkm"
	CollabDirectionUMKMToPartner = "umkm_to_partner"
)

func ValidCollabStatus(status string) bool {
	switch status {
	case CollabStatusPending, CollabStatusAccepted, CollabStatusRejected, CollabStatusWithdrawn, CollabStatusExpired:
		return true
	default:
		return false
	}
}

func ValidCollabDirection(dir string) bool {
	return dir == CollabDirectionPartnerToUMKM || dir == CollabDirectionUMKMToPartner
}

// CollaborationRequest represents a formal partnership request between Mitra and UMKM.
type CollaborationRequest struct {
	ID                     string     `json:"id"`
	SenderUserID           string     `json:"senderUserId"`
	SenderName             string     `json:"senderName"`
	SenderRole             string     `json:"senderRole"`
	ReceiverUserID         string     `json:"receiverUserId"`
	ReceiverName           string     `json:"receiverName"`
	ReceiverRole           string     `json:"receiverRole"`
	BusinessID             string     `json:"businessId,omitempty"`
	BusinessName           string     `json:"businessName,omitempty"`
	BusinessSlug           string     `json:"businessSlug,omitempty"`
	BusinessCategory       string     `json:"businessCategory,omitempty"`
	BusinessLocation       string     `json:"businessLocation,omitempty"`
	BusinessCoverImage     string     `json:"businessCoverImage,omitempty"`
	PartnerProfileID       string     `json:"partnerProfileId,omitempty"`
	PartnerCompanyName     string     `json:"partnerCompanyName,omitempty"`
	PartnerType            string     `json:"partnerType,omitempty"`
	PartnerLogo            string     `json:"partnerLogo,omitempty"`
	PartnerLocation        string     `json:"partnerLocation,omitempty"`
	Direction              string     `json:"direction"`
	CollaborationType      string     `json:"collaborationType"`
	CollaborationTypeLabel string     `json:"collaborationTypeLabel"`
	Title                  string     `json:"title"`
	Message                string     `json:"message"`
	ProposalDetail         string     `json:"proposalDetail"`
	Status                 string     `json:"status"`
	ConversationID         string     `json:"conversationId,omitempty"`
	RespondedAt            *time.Time `json:"respondedAt,omitempty"`
	ExpiresAt              time.Time  `json:"expiresAt"`
	CreatedAt              time.Time  `json:"createdAt"`
	UpdatedAt              time.Time  `json:"updatedAt"`
}

type CollaborationStats struct {
	Total    int64 `json:"total"`
	Pending  int64 `json:"pending"`
	Accepted int64 `json:"accepted"`
	Rejected int64 `json:"rejected"`
}

type CollaborationRequestList struct {
	Items []CollaborationRequest `json:"items"`
	Total int64                  `json:"total"`
	Page  int                    `json:"page"`
	Limit int                    `json:"limit"`
}

type CreateCollaborationRequestInput struct {
	ReceiverUserID    string `json:"receiverUserId"`
	BusinessID        string `json:"businessId"`
	PartnerProfileID  string `json:"partnerProfileId"`
	Direction         string `json:"direction"`
	CollaborationType string `json:"collaborationType"`
	Title             string `json:"title"`
	Message           string `json:"message"`
	ProposalDetail    string `json:"proposalDetail"`
}

func (in *CreateCollaborationRequestInput) Sanitize() {
	in.ReceiverUserID = strings.TrimSpace(in.ReceiverUserID)
	in.BusinessID = strings.TrimSpace(in.BusinessID)
	in.PartnerProfileID = strings.TrimSpace(in.PartnerProfileID)
	in.Direction = strings.TrimSpace(in.Direction)
	in.CollaborationType = NormalizeTaxonomyIdentifier(in.CollaborationType)
	in.Title = strings.TrimSpace(in.Title)
	in.Message = strings.TrimSpace(in.Message)
	in.ProposalDetail = strings.TrimSpace(in.ProposalDetail)
}

func (in *CreateCollaborationRequestInput) Validate() error {
	in.Sanitize()
	if in.ReceiverUserID == "" && in.BusinessID == "" && in.PartnerProfileID == "" {
		return invalid("Penerima atau bisnis tujuan kolaborasi wajib ditentukan.")
	}
	if !ValidCollabDirection(in.Direction) {
		return invalid("Arah pengajuan kolaborasi tidak valid.")
	}
	if !ValidTaxonomyIdentifier(in.CollaborationType) {
		return invalid("Jenis kemitraan tidak dikenal dalam Master Taxonomy.")
	}
	if in.Title == "" {
		return invalid("Judul pengajuan kolaborasi wajib diisi.")
	}
	if len(in.Title) > 150 {
		return invalid("Judul pengajuan maksimal 150 karakter.")
	}
	if in.Message == "" {
		return invalid("Pesan pengajuan wajib diisi.")
	}
	if len(in.Message) > 3000 {
		return invalid("Pesan pengajuan maksimal 3000 karakter.")
	}
	if len(in.ProposalDetail) > 5000 {
		return invalid("Detail proposal maksimal 5000 karakter.")
	}
	return nil
}

type RespondCollaborationInput struct {
	Reason string `json:"reason"`
}

// -----------------------------------------------------------------------------
// INBOX & CONVERSATION MODELS
// -----------------------------------------------------------------------------

type Message struct {
	ID             string     `json:"id"`
	ConversationID string     `json:"conversationId"`
	SenderID       string     `json:"senderId"`
	SenderName     string     `json:"senderName"`
	Content        string     `json:"content"`
	ReadAt         *time.Time `json:"readAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

type Conversation struct {
	ID                     string    `json:"id"`
	CollaborationRequestID string    `json:"collaborationRequestId"`
	RequestTitle           string    `json:"requestTitle"`
	CollaborationType      string    `json:"collaborationType"`
	CollaborationTypeLabel string    `json:"collaborationTypeLabel"`
	OtherParticipantID     string    `json:"otherParticipantId"`
	OtherParticipantName   string    `json:"otherParticipantName"`
	OtherParticipantRole   string    `json:"otherParticipantRole"`
	OtherParticipantAvatar string    `json:"otherParticipantAvatar,omitempty"`
	LastMessage            *Message  `json:"lastMessage,omitempty"`
	UnreadCount            int       `json:"unreadCount"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

type SendMessageInput struct {
	Content string `json:"content"`
}

func (in *SendMessageInput) Sanitize() {
	in.Content = strings.TrimSpace(in.Content)
}

func (in *SendMessageInput) Validate() error {
	in.Sanitize()
	if in.Content == "" {
		return invalid("Isi pesan tidak boleh kosong.")
	}
	if len(in.Content) > 4000 {
		return invalid(fmt.Sprintf("Pesan maksimal 4000 karakter, diterima %d karakter.", len(in.Content)))
	}
	return nil
}

type MessageList struct {
	Items []Message `json:"items"`
	Total int64     `json:"total"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
}
