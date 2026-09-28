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

RUN apk add --no-cache ca-certificates \
    && adduser -D -u 10001 lumora

WORKDIR /app
COPY --from=build /out/api /out/migrate /out/seed /app/
COPY migrations /app/migrations

RUN mkdir -p /app/uploads && chown -R lumora:lumora /app

USER lumora
EXPOSE 8080

# compose decides which binary each service runs
CMD ["/app/api"]
