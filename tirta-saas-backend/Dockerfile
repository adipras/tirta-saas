FROM golang:1.24.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/tirta-saas-backend main.go

FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /out/tirta-saas-backend /app/tirta-saas-backend

RUN mkdir -p /app/uploads/logos \
    /app/uploads/platform/qr \
    /app/uploads/tenants \
    /app/storage/private/payment-proofs \
    /app/storage/private/subscription-proofs \
    /app/storage/private/imports

EXPOSE 8081

CMD ["/app/tirta-saas-backend"]
