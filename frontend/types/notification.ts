export type NotificationType =
  | "collab_request_created"
  | "collab_request_accepted"
  | "collab_request_rejected"
  | "collab_started"
  | "collab_completed"
  | "collab_cancelled"
  | "new_message"
  | "system";

export type NotificationTargetType =
  | "collaboration"
  | "conversation"
  | "history"
  | "system";

export interface Notification {
  id: string;
  recipientUserId: string;
  actorUserId?: string;
  actorName?: string;
  actorRole?: "umkm" | "mitra";
  actorAvatar?: string;
  type: NotificationType | string;
  title: string;
  body: string;
  targetType: NotificationTargetType | string;
  targetId: string;
  readAt?: string;
  createdAt: string;
}

export interface NotificationList {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

