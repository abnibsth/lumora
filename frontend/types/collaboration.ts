import type { MasterTaxonomyID } from "./partner";

export type CollaborationStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "rejected"
  | "withdrawn"
  | "cancelled"
  | "expired";

export type CollaborationDirection = "partner_to_umkm" | "umkm_to_partner";

export interface CollaborationRequest {
  id: string;
  senderUserId: string;
  senderName: string;
  senderRole: "umkm" | "mitra";
  receiverUserId: string;
  receiverName: string;
  receiverRole: "umkm" | "mitra";
  businessId?: string;
  businessName?: string;
  businessSlug?: string;
  businessCategory?: string;
  businessLocation?: string;
  businessCoverImage?: string;
  partnerProfileId?: string;
  partnerCompanyName?: string;
  partnerType?: string;
  partnerLogo?: string;
  partnerLocation?: string;
  direction: CollaborationDirection;
  collaborationType: MasterTaxonomyID | string;
  collaborationTypeLabel: string;
  title: string;
  message: string;
  proposalDetail: string;
  status: CollaborationStatus;
  conversationId?: string;
  respondedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export interface CollaborationEvent {
  id: string;
  requestId: string;
  actorUserId: string;
  actorName: string;
  actorRole: "umkm" | "mitra";
  fromStatus: string;
  toStatus: string;
  reason?: string;
  createdAt: string;
}

export interface CollaborationHistoryDetail {
  request: CollaborationRequest;
  events: CollaborationEvent[];
}

export interface CollaborationHistoryStats {
  total: number;
  pending: number;
  accepted: number;
  inProgress: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

export interface CollaborationRequestList {
  items: CollaborationRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCollaborationInput {
  receiverUserId: string;
  businessId?: string;
  partnerProfileId?: string;
  direction: CollaborationDirection;
  collaborationType: string;
  title: string;
  message: string;
  proposalDetail?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  collaborationRequestId: string;
  requestTitle: string;
  collaborationType: string;
  collaborationTypeLabel: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantRole: "umkm" | "mitra";
  otherParticipantAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageList {
  items: Message[];
  total: number;
  page: number;
  limit: number;
}

