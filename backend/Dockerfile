# syntax=docker/dockerfile:1

FROM golang:1.27-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api \
    && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate \
    && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/seed ./cmd/seed

FROM alpine:3.22

RUN apk add --no-cache ca-certificates su-exec \
    && adduser -D -u 10001 lumora

WORKDIR /app
COPY --from=build /out/api /out/migrate /out/seed /app/
COPY migrations /app/migrations

# Kept outside /app and root-owned so the unprivileged app user can run it
# but not rewrite it.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /app/uploads \
    && chown -R lumora:lumora /app

# Absolute, so uploads never depend on the working directory. This is where
# the Railway volume gets mounted.
ENV UPLOAD_DIR=/app/uploads

USER lumora
EXPOSE 8080

# compose decides which binary each service runs
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["/app/api"]
