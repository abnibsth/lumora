// Package middleware holds gin middleware shared by the API routes.
package middleware

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/alfian/lumora/backend/internal/domain"
)

// UserResolver resolves a session token to an account (implemented by
// service.AuthService).
type UserResolver interface {
	UserByToken(ctx context.Context, token string) (domain.User, error)
}

type contextKey string

const userContextKey contextKey = "lumora.user"

// AttachSession reads the session cookie on every request and, when it maps
// to a live session, puts the user in the context. It never blocks a request:
// routes decide separately whether a user is required.
func AttachSession(resolver UserResolver) gin.HandlerFunc {
	return func(c *gin.Context) {
		if token, err := c.Cookie(domain.SessionCookieName); err == nil && token != "" {
			if user, err := resolver.UserByToken(c.Request.Context(), token); err == nil {
				c.Set(string(userContextKey), user)
			}
		}
		c.Next()
	}
}

// CurrentUser returns the user AttachSession attached, if any.
func CurrentUser(c *gin.Context) (domain.User, bool) {
	value, ok := c.Get(string(userContextKey))
	if !ok {
		return domain.User{}, false
	}
	user, ok := value.(domain.User)
	return user, ok
}

// RequireSession answers 401 with the standard error envelope when the
// request carries no valid session. Use after AttachSession.
func RequireSession() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, ok := CurrentUser(c); !ok {
			abortWithError(c, http.StatusUnauthorized, "unauthenticated", "Silakan masuk terlebih dahulu.")
			return
		}
		c.Next()
	}
}

// abortWithError writes the API's single error envelope and stops the chain.
//
// It lives here rather than in the handler package because handler imports
// middleware, so middleware cannot import writeError back. Keep the shape in
// sync with handler.writeError: this is the same contract, documented in
// docs/api.md.
func abortWithError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{
		"error": gin.H{
			"code":    code,
			"message": message,
		},
	})
}
