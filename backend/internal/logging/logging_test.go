package logging

import (
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"
)

func TestParseLevel(t *testing.T) {
	cases := []struct {
		name  string
		level string
		want  slog.Level
	}{
		{"debug", "debug", slog.LevelDebug},
		{"info", "info", slog.LevelInfo},
		{"warn", "warn", slog.LevelWarn},
		{"error", "error", slog.LevelError},
		{"empty falls back to info", "", slog.LevelInfo},
		{"unknown falls back to info", "verbose", slog.LevelInfo},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := parseLevel(tc.level); got != tc.want {
				t.Fatalf("parseLevel(%q) = %v, want %v", tc.level, got, tc.want)
			}
		})
	}
}

func TestSetupFormatFollowsEnv(t *testing.T) {
	cases := []struct {
		name   string
		appEnv string
		want   string
	}{
		{"production is json", "production", `"msg":"hello"`},
		{"development is text", "development", "msg=hello"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			previous := slog.Default()
			t.Cleanup(func() { slog.SetDefault(previous) })

			reader, writer, err := os.Pipe()
			if err != nil {
				t.Fatalf("pipe: %v", err)
			}
			originalStdout := os.Stdout
			os.Stdout = writer
			t.Cleanup(func() { os.Stdout = originalStdout })

			Setup(tc.appEnv, "info")
			slog.Info("hello")
			if err := writer.Close(); err != nil {
				t.Fatalf("close writer: %v", err)
			}

			out, _ := io.ReadAll(reader)
			if !strings.Contains(string(out), tc.want) {
				t.Fatalf("output = %q, want it to contain %q", out, tc.want)
			}
		})
	}
}
