package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type fakeCollabService struct {
	request       domain.CollaborationRequest
	incomingList  domain.CollaborationRequestList
	outgoingList  domain.CollaborationRequestList
	stats         domain.CollaborationStats
	conversations []domain.Conversation
	messages      domain.MessageList
	sentMessage   domain.Message
	err           error

	gotUserID string
	gotReqID  string
	gotConvID string
	gotInput  domain.CreateCollaborationRequestInput
	gotMsgIn  domain.SendMessageInput
}

func (f *fakeCollabService) CreateRequest(_ context.Context, _ domain.User, in domain.CreateCollaborationRequestInput) (domain.CollaborationRequest, error) {
	f.gotInput = in
	return f.request, f.err
}

func (f *fakeCollabService) ListIncoming(_ context.Context, userID, _, _ string, _, _ int) (domain.CollaborationRequestList, error) {
	f.gotUserID = userID
	return f.incomingList, f.err
}

func (f *fakeCollabService) ListOutgoing(_ context.Context, userID, _, _ string, _, _ int) (domain.CollaborationRequestList, error) {
	f.gotUserID = userID
	return f.outgoingList, f.err
}

func (f *fakeCollabService) GetStats(_ context.Context, userID string) (domain.CollaborationStats, error) {
	f.gotUserID = userID
	return f.stats, f.err
}

func (f *fakeCollabService) GetRequestByID(_ context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	f.gotUserID = userID
	f.gotReqID = requestID
	return f.request, f.err
}

func (f *fakeCollabService) AcceptRequest(_ context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	f.gotUserID = userID
	f.gotReqID = requestID
	return f.request, f.err
}

func (f *fakeCollabService) RejectRequest(_ context.Context, userID, requestID, _ string) (domain.CollaborationRequest, error) {
	f.gotUserID = userID
	f.gotReqID = requestID
	return f.request, f.err
}

func (f *fakeCollabService) WithdrawRequest(_ context.Context, userID, requestID string) (domain.CollaborationRequest, error) {
	f.gotUserID = userID
	f.gotReqID = requestID
	return f.request, f.err
}

func (f *fakeCollabService) ListConversations(_ context.Context, userID string) ([]domain.Conversation, error) {
	f.gotUserID = userID
	return f.conversations, f.err
}

func (f *fakeCollabService) GetMessages(_ context.Context, userID, conversationID string, _, _ int) (domain.MessageList, error) {
	f.gotUserID = userID
	f.gotConvID = conversationID
	return f.messages, f.err
}

func (f *fakeCollabService) SendMessage(_ context.Context, _ domain.User, conversationID string, in domain.SendMessageInput) (domain.Message, error) {
	f.gotConvID = conversationID
	f.gotMsgIn = in
	return f.sentMessage, f.err
}

func newCollabTestRouter(svc CollabService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	h := NewCollaborationHandler(svc)

	v1.POST("/collaborations", middleware.RequireSession(), h.Create)
	v1.GET("/collaborations/inbox", middleware.RequireSession(), h.ListIncoming)
	v1.GET("/collaborations/outbox", middleware.RequireSession(), h.ListOutgoing)
	v1.GET("/collaborations/stats", middleware.RequireSession(), h.GetStats)
	v1.GET("/collaborations/:id", middleware.RequireSession(), h.GetDetail)
	v1.POST("/collaborations/:id/accept", middleware.RequireSession(), h.Accept)
	v1.POST("/collaborations/:id/reject", middleware.RequireSession(), h.Reject)
	v1.POST("/collaborations/:id/withdraw", middleware.RequireSession(), h.Withdraw)

	v1.GET("/inbox/conversations", middleware.RequireSession(), h.ListConversations)
	v1.GET("/inbox/conversations/:id/messages", middleware.RequireSession(), h.GetMessages)
	v1.POST("/inbox/conversations/:id/messages", middleware.RequireSession(), h.SendMessage)
	return router
}

func TestCollabCreate_RequiresSession(t *testing.T) {
	router := newCollabTestRouter(&fakeCollabService{}, newFakeService())
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/v1/collaborations", nil))

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", recorder.Code)
	}
}

func TestCollabCreate_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		request: domain.CollaborationRequest{
			ID:                "req-1",
			SenderUserID:      "usr-partner-1",
			SenderRole:        domain.RoleMitra,
			ReceiverUserID:    "usr-umkm-1",
			ReceiverRole:      domain.RoleUMKM,
			Direction:         domain.CollabDirectionPartnerToUMKM,
			CollaborationType: domain.TaxonomyProductDistribution,
			Title:             "Kemitraan Distribusi Bandung",
			Status:            domain.CollabStatusPending,
		},
	}
	router := newCollabTestRouter(svc, auth)
	body := `{"receiverUserId":"usr-umkm-1","businessId":"biz-1","direction":"partner_to_umkm","collaborationType":"PRODUCT_DISTRIBUTION","title":"Kemitraan Distribusi Bandung","message":"Tertarik distribusi"}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/collaborations", body))

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestCollabListIncoming_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		incomingList: domain.CollaborationRequestList{
			Items: []domain.CollaborationRequest{
				{ID: "req-1", Title: "Ajakan Kerjasama"},
			},
			Total: 1,
			Page:  1,
			Limit: 10,
		},
	}
	router := newCollabTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/collaborations/inbox", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
}

func TestCollabAccept_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		request: domain.CollaborationRequest{
			ID:             "req-1",
			Status:         domain.CollabStatusAccepted,
			ConversationID: "conv-1",
		},
	}
	router := newCollabTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/collaborations/req-1/accept", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	if svc.gotReqID != "req-1" {
		t.Errorf("got reqID %q, want req-1", svc.gotReqID)
	}
}

func TestCollabSendMessage_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		sentMessage: domain.Message{
			ID:             "msg-1",
			ConversationID: "conv-1",
			SenderID:       "usr-partner-1",
			Content:        "Halo, mari kita bahas jadwal pertemuan.",
			CreatedAt:      time.Now(),
		},
	}
	router := newCollabTestRouter(svc, auth)
	body := `{"content":"Halo, mari kita bahas jadwal pertemuan."}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/inbox/conversations/conv-1/messages", body))

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestCollabSendMessage_LockedError(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		err: &domain.ValidationError{Message: "Percakapan belum aktif karena pengajuan kolaborasi belum disetujui."},
	}
	router := newCollabTestRouter(svc, auth)
	body := `{"content":"Halo"}`
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPost, "/api/v1/inbox/conversations/conv-1/messages", body))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", recorder.Code)
	}
}

func TestCollabDetail_NotFound(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeCollabService{
		err: domain.ErrNotFound,
	}
	router := newCollabTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/collaborations/unknown-id", ""))

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", recorder.Code)
	}
}

