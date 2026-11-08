package domain

import (
	"time"
)

const (
	NotifTypeCollabCreated   = "collab_request_created"
	NotifTypeCollabAccepted  = "collab_request_accepted"
	NotifTypeCollabRejected  = "collab_request_rejected"
	NotifTypeCollabStarted   = "collab_started"
	NotifTypeCollabCompleted = "collab_completed"
	NotifTypeCollabCancelled = "collab_cancelled"
	NotifTypeNewMessage      = "new_message"
	NotifTypeSystem          = "system"

	NotifTargetCollab       = "collaboration"
	NotifTargetConversation = "conversation"
	NotifTargetHistory      = "history"
	NotifTargetSystem       = "system"
)

// Notification represents an activity notification in the user's feed.
type Notification struct {
	ID              string     `json:"id"`
	RecipientUserID string     `json:"recipientUserId"`
	ActorUserID     *string    `json:"actorUserId,omitempty"`
	ActorName       string     `json:"actorName,omitempty"`
	ActorRole       string     `json:"actorRole,omitempty"`
	ActorAvatar     string     `json:"actorAvatar,omitempty"`
	Type            string     `json:"type"`
	Title           string     `json:"title"`
	Body            string     `json:"body"`
	TargetType      string     `json:"targetType"`
	TargetID        string     `json:"targetId"`
	ReadAt          *time.Time `json:"readAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}

type NotificationList struct {
	Items       []Notification `json:"items"`
	Total       int64          `json:"total"`
	UnreadCount int64          `json:"unreadCount"`
	Page        int            `json:"page"`
	Limit       int            `json:"limit"`
}
