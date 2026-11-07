"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Building2,
  Store,
  CheckCheck,
  Search,
  Lock,
  RefreshCw,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchInboxConversations,
  fetchConversationMessages,
  sendMessageApi,
} from "@/lib/api";
import type { Conversation, Message } from "@/types/collaboration";
import type { User } from "@/types/user";

export function PartnerInboxView({
  user,
  initialConversationId,
}: {
  user: User;
  initialConversationId?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    const res = await fetchInboxConversations();
    setLoadingConvs(false);
    if (res.ok && res.conversations) {
      setConversations(res.conversations);
      if (!selectedConvId && res.conversations.length > 0) {
        setSelectedConvId(res.conversations[0].id);
      }
    }
  }, [selectedConvId]);

  async function loadMessages(convId: string) {
    setLoadingMsgs(true);
    const res = await fetchConversationMessages(convId);
    setLoadingMsgs(false);
    if (res.ok && res.data) {
      setMessages(res.data.items);
    }
  }

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !selectedConvId || sending) return;

    const content = inputContent.trim();
    setInputContent("");
    setSending(true);

    const res = await sendMessageApi(selectedConvId, content);
    setSending(false);

    if (res.ok && res.message) {
      setMessages((curr) => [...curr, res.message!]);
      loadConversations();
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherParticipantName.toLowerCase().includes(q) ||
      c.requestTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-[1160px] space-y-4 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
          <MessageSquare className="size-3" />
          <span>Komunikasi Terbuka</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
          Inbox & Pesan Kemitraan
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Ruang percakapan resmi antar-mitra yang otomatis terbuka begitu pengajuan kolaborasi disetujui.
        </p>
      </div>

      {/* Main 2-Pane Inbox Window */}
      <div className="rounded-xl border border-line bg-surface shadow-2xs overflow-hidden flex flex-col md:flex-row h-[620px]">
        {/* Left Pane: Conversations List (~35%) */}
        <div className="w-full md:w-80 md:min-w-72 border-b md:border-b-0 md:border-r border-line bg-ivory/40 flex flex-col">
          {/* Search bar & Refresh */}
          <div className="p-3 border-b border-line/60 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pesan atau mitra..."
                className="h-8.5 w-full rounded-lg border border-line bg-white pl-8 pr-2.5 text-xs text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>
            <button
              type="button"
              onClick={loadConversations}
              title="Perbarui daftar"
              className="flex size-8.5 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-forest transition-colors shrink-0"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/40">
            {loadingConvs ? (
              <div className="p-6 text-center text-xs text-muted flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-forest" />
                <span>Memuat percakapan...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="size-6 text-muted mx-auto" />
                <p className="text-xs font-semibold text-forest">Belum Ada Percakapan</p>
                <p className="text-[11px] text-muted leading-relaxed">
                  Percakapan akan muncul begitu pengajuan kolaborasi diterima.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === selectedConvId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                      isActive
                        ? "bg-soft-green/70 border-l-3 border-l-forest"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <div className="size-8.5 rounded-lg border border-line bg-white flex items-center justify-center shrink-0 mt-0.5">
                      {c.otherParticipantRole === "umkm" ? (
                        <Store className="size-4 text-forest" />
                      ) : (
                        <Building2 className="size-4 text-forest" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-forest truncate block">
                          {c.otherParticipantName}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="size-4 rounded-full bg-forest text-[9px] font-bold text-lime flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-medium text-forest/80 truncate mt-0.5">
                        {c.requestTitle}
                      </p>

                      <p className="text-[10.5px] text-muted truncate mt-0.5">
                        {c.lastMessage ? c.lastMessage.content : "Ruang percakapan resmi dibuka"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Area (~65%) */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConv ? (
            <>
              {/* Top Chat Bar */}
              <div className="p-3 sm:px-4 border-b border-line flex items-center justify-between bg-surface/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-8.5 rounded-lg border border-line bg-white flex items-center justify-center shrink-0">
                    {selectedConv.otherParticipantRole === "umkm" ? (
                      <Store className="size-4 text-forest" />
                    ) : (
                      <Building2 className="size-4 text-forest" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-forest truncate">
                        {selectedConv.otherParticipantName}
                      </span>
                      <Badge tone="demo" className="text-[10px] py-0 px-1.5">
                        {selectedConv.otherParticipantRole === "umkm" ? "UMKM" : "Mitra"}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted truncate block">
                      Topik: {selectedConv.requestTitle} ({selectedConv.collaborationTypeLabel})
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ivory/20">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                    <Loader2 className="size-4 animate-spin text-forest" />
                    <span>Memuat pesan...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted">
                    <Lock className="size-5 mx-auto mb-1 text-forest" />
                    <span>Percakapan resmi telah dibuka. Tuliskan pesan pertama Anda.</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user.id;
                    const timeStr = new Date(m.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                            isMine
                              ? "bg-forest text-white rounded-br-2xs"
                              : "bg-surface border border-line text-forest rounded-bl-2xs"
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 ${
                              isMine ? "text-white/60" : "text-muted"
                            }`}
                          >
                            <span>{timeStr}</span>
                            {isMine && m.readAt && <CheckCheck className="size-3 text-lime" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-line bg-surface flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                  className="flex-1 rounded-lg border border-line bg-white p-2.5 text-xs text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest resize-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={sending || !inputContent.trim()}
                  className={buttonStyles({
                    variant: "primary",
                    size: "sm",
                    className: "h-10 px-3.5 gap-1.5 shadow-2xs shrink-0",
                  })}
                >
                  {sending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Kirim</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted">
              <MessageSquare className="size-8 mb-2 text-forest/40" />
              <p className="text-xs font-semibold text-forest">Pilih Percakapan</p>
              <p className="text-[11px] max-w-xs mt-0.5">
                Pilih salah satu percakapan di sebelah kiri untuk melihat dan mengirim pesan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

