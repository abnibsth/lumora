// Package logging configures the process-wide slog logger.
//
// It is the only place that decides log format; every other package logs
// through the slog default set up here, so no constructor has to carry a
// logger around.
package logging

import (
	"log/slog"
	"os"
)

// Setup installs the default logger: JSON in production, human-readable text
// otherwise. level is already validated by config.Load, so an unrecognized
// value falls back to info rather than failing a process that is mid-boot.
func Setup(appEnv, level string) {
	opts := &slog.HandlerOptions{Level: parseLevel(level)}
	var handler slog.Handler
	if appEnv == "production" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}
	slog.SetDefault(slog.New(handler))
}

// Fatal logs at error level and exits with status 1, replacing log.Fatalf.
// Deferred functions do not run, matching log.Fatalf. It is safe before Setup:
// slog.Default is never nil, so a config-load failure still prints.
func Fatal(msg string, args ...any) {
	slog.Error(msg, args...)
	os.Exit(1)
}

// parseLevel maps a validated LOG_LEVEL to a slog level. config.Load rejects
// anything outside its allowlist, so the default here only guards a value that
// slipped past it.
func parseLevel(level string) slog.Level {
	switch level {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
