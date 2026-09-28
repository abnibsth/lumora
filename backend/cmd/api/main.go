package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/config"
	"github.com/alfian/lumora/backend/internal/http/handler"
	"github.com/alfian/lumora/backend/internal/http/middleware"
	"github.com/alfian/lumora/backend/internal/service"
	"github.com/alfian/lumora/backend/internal/store"
)

func main() {
	cfg := config.Load()

	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db pool: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping: %v", err)
	}

	queries := store.New(pool)
	businessService := service.NewBusinessService(queries)
	businessHandler := handler.NewBusinessHandler(businessService)

	authService := service.NewAuthService(queries, queries)
	authHandler := handler.NewAuthHandler(authService, cfg.IsProduction())

	bookmarkService := service.NewBookmarkService(queries, queries)
	bookmarkHandler := handler.NewBookmarkHandler(bookmarkService)
	mediaHandler := handler.NewMediaHandler(cfg.UploadDir)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), middleware.AttachSession(authService))

	// Uploaded covers/logos are public, like the seed images: served from disk
	// under a server-generated filename.
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		log.Fatalf("upload dir: %v", err)
	}
	r.Static("/uploads", cfg.UploadDir)

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")
	v1.GET("/businesses", businessHandler.List)
	v1.GET("/businesses/:slug", businessHandler.Detail)
	v1.POST("/businesses", middleware.RequireSession(), businessHandler.Create)
	v1.PATCH("/businesses/:id", middleware.RequireSession(), businessHandler.Update)
	v1.POST("/businesses/:id/publish", middleware.RequireSession(), businessHandler.Publish)

	v1.POST("/auth/register", authHandler.Register)
	v1.POST("/auth/login", authHandler.Login)
	v1.POST("/auth/logout", authHandler.Logout)
	v1.GET("/auth/me", middleware.RequireSession(), authHandler.Me)

	v1.GET("/bookmarks", middleware.RequireSession(), bookmarkHandler.List)
	v1.POST("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Add)
	v1.DELETE("/bookmarks/:slug", middleware.RequireSession(), bookmarkHandler.Remove)

	v1.POST("/media", middleware.RequireSession(), mediaHandler.Upload)

	log.Printf("LUMORA API listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
