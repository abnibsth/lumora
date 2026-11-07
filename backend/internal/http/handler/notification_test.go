package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
	"github.com/alfian/lumora/backend/internal/http/middleware"
)

type fakeNotifService struct {
	list        domain.NotificationList
	unreadCount int64
	err         error

	gotUserID  string
	gotNotifID string
}

func (f *fakeNotifService) List(_ context.Context, userID, _ string, _ bool, _, _ int) (domain.NotificationList, error) {
	f.gotUserID = userID
	return f.list, f.err
}

func (f *fakeNotifService) GetUnreadCount(_ context.Context, userID string) (int64, error) {
	f.gotUserID = userID
	return f.unreadCount, f.err
}

func (f *fakeNotifService) MarkRead(_ context.Context, userID, notifID string) error {
	f.gotUserID = userID
	f.gotNotifID = notifID
	return f.err
}

func (f *fakeNotifService) MarkAllRead(_ context.Context, userID string) error {
	f.gotUserID = userID
	return f.err
}

func newNotifTestRouter(svc NotifService, auth *fakeAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.AttachSession(auth))
	v1 := router.Group("/api/v1")
	h := NewNotificationHandler(svc)

	v1.GET("/notifications", middleware.RequireSession(), h.List)
	v1.GET("/notifications/unread-count", middleware.RequireSession(), h.UnreadCount)
	v1.PATCH("/notifications/read-all", middleware.RequireSession(), h.MarkAllRead)
	v1.PATCH("/notifications/:id/read", middleware.RequireSession(), h.MarkRead)
	return router
}

func TestNotificationList_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	now := time.Now()
	svc := &fakeNotifService{
		list: domain.NotificationList{
			Items: []domain.Notification{
				{
					ID:              "notif-1",
					RecipientUserID: "usr-partner-1",
					Type:            domain.NotifTypeCollabCreated,
					Title:           "Pengajuan Baru",
					Body:            "Ada pengajuan kolaborasi",
					CreatedAt:       now,
				},
			},
			Total:       1,
			UnreadCount: 1,
			Page:        1,
			Limit:       20,
		},
		unreadCount: 1,
	}
	router := newNotifTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/notifications", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
}

func TestNotificationUnreadCount_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeNotifService{unreadCount: 3}
	router := newNotifTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodGet, "/api/v1/notifications/unread-count", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
}

func TestNotificationMarkRead_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeNotifService{}
	router := newNotifTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPatch, "/api/v1/notifications/notif-1/read", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
	if svc.gotNotifID != "notif-1" {
		t.Errorf("got notifID %q, want notif-1", svc.gotNotifID)
	}
}

func TestNotificationMarkAllRead_Success(t *testing.T) {
	auth := partnerSessionAuth(domain.RoleMitra)
	svc := &fakeNotifService{}
	router := newNotifTestRouter(svc, auth)
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, sessionRequest(http.MethodPatch, "/api/v1/notifications/read-all", ""))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", recorder.Code)
	}
}

