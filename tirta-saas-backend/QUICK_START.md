# 🚀 Tirta SaaS Backend - Quick Start Guide

**Status:** ✅ Production Ready  
**Version:** 1.0.0

---

## ⚡ 5-Minute Setup

### 1. Install Prerequisites
```bash
# Go 1.24+
go version

# PostgreSQL 15+
psql --version
```

### 2. Setup Project
```bash
# Clone repository
git clone <your-repo-url>
cd tirta-saas-backend

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 3. Setup Database
```bash
# Create database
createdb tirta_saas

# Migrations run automatically on first start
```

### 4. Seed Platform Admin
```bash
go run scripts/seed_platform_admin.go
```

**Default Admin:**
- 📧 Email: `admin@tirtasaas.com`
- 🔑 Password: `admin123`

### 5. Start Server
```bash
go run main.go
```

Server runs on: **http://localhost:8081**

---

## 🎯 Quick Links

| Resource | URL |
|----------|-----|
| **API Server** | http://localhost:8081 |
| **Health Check** | http://localhost:8081/health |
| **Swagger Docs** | http://localhost:8081/swagger/index.html |
| **Metrics** | http://localhost:8081/metrics |

---

## 🔐 Test Login

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tirtasaas.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "platform_owner"
}
```

---

## 📦 Postman Collection

### Generate Collection
```bash
bash scripts/generate-postman.sh
```

### Import to Postman
1. Open Postman
2. Import → File
3. Select both files:
   - `docs/Tirta-SaaS-Backend.postman_collection.json`
   - `docs/Tirta-SaaS-Backend.postman_environment.json`
4. Select environment: "Tirta SaaS - Local Development"
5. Run "Login" request first
6. Token auto-saved for all requests

---

## 📚 Key Endpoints

### Authentication
```
POST /auth/login          # Login (all roles)
POST /auth/register       # Register new tenant
GET  /auth/me            # Current user info
```

### Platform Management (Platform Owner)
```
GET  /api/platform/tenants              # List tenants
POST /api/platform/tenants              # Create tenant
GET  /api/platform/analytics/overview   # Dashboard
```

### Tenant Operations (Tenant Admin)
```
GET  /api/customers                     # List customers
POST /api/customers                     # Create customer
GET  /api/invoices                      # List invoices
POST /api/invoices/generate             # Generate invoice
```

### Customer Portal
```
GET  /api/customer/profile              # My profile
GET  /api/customer/invoices             # My invoices
POST /api/customer/payments             # Make payment
```

---

## 🛠️ Development Commands

### Run Server
```bash
# Development mode
go run main.go

# With hot reload (if air installed)
air
```

### Build Binary
```bash
go build -o tirta-backend
./tirta-backend
```

### Generate Swagger Docs
```bash
swag init --parseDependency --parseInternal
```

### Database Operations
```bash
# Seed admin
go run scripts/seed_platform_admin.go

# Reset admin password
go run scripts/reset_platform_password.go
```

---

## 🔑 Default Accounts

### Platform Admin
```
Email:    admin@tirtasaas.com
Password: admin123
Role:     platform_owner
```

⚠️ **Important:** Change password after first login in production!

---

## 📊 Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `platform_owner` | Platform administrator | Full access to all tenants |
| `tenant_admin` | Tenant administrator | Full access to tenant data |
| `tenant_user` | Tenant staff | Limited tenant operations |
| `customer` | End customer | Self-service portal only |

---

## 🧪 Quick Test

### 1. Health Check
```bash
curl http://localhost:8081/health
```

### 2. Login
```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tirtasaas.com","password":"admin123"}'
```

### 3. Get Current User (with token)
```bash
curl http://localhost:8081/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. List Tenants
```bash
curl http://localhost:8081/api/platform/tenants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📁 Project Structure

```
tirta-saas-backend/
├── config/              # DB config & migration
├── constants/           # Roles & permissions
├── controllers/         # 18 controllers
├── docs/                # Swagger & Postman
├── middleware/          # Auth & RBAC
├── models/              # 19 database models
├── routes/              # 12 route groups
├── scripts/             # Utility scripts
├── main.go              # Entry point
└── .env                 # Configuration
```

---

## 🌐 Environment Variables

### Required Settings
```bash
# Server
PORT=8081
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tirta_saas

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY_HOURS=168

# Admin Seeder
AUTO_SEED_ADMIN=true
```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `QUICK_START.md` | This guide |
| `FINAL_STATUS.md` | Complete status report |
| `API_MANUAL_TEST_GUIDE.md` | Testing guide |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Deployment steps |
| `BACKEND_AUDIT_REPORT.md` | Technical audit |
| Swagger UI | Interactive API docs |

---

## ❓ Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :8081

# Kill existing process
kill -9 <PID>
```

### Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d tirta_saas
```

### Login fails
```bash
# Verify admin exists
go run scripts/seed_platform_admin.go

# Check database
psql tirta_saas -c "SELECT email, role FROM users WHERE role='platform_owner';"
```

### Swagger not updating
```bash
# Regenerate docs
swag init --parseDependency --parseInternal

# Restart server
```

---

## 🎯 Next Steps

### For Developers
1. ✅ Setup complete
2. → Explore Swagger documentation
3. → Test with Postman collection
4. → Review API endpoints
5. → Start frontend integration

### For DevOps
1. → Review `PRODUCTION_DEPLOYMENT_GUIDE.md`
2. → Setup production environment
3. → Configure monitoring
4. → Deploy to staging

---

## 📊 Quick Stats

```
Total Endpoints:    93
Controllers:        18
Models:             19
User Roles:         4
Documentation:      100% complete
Test Coverage:      Manual testing complete
Status:             Production Ready ✅
```

---

## 🆘 Need Help?

### Check Documentation
1. Swagger UI: `/swagger/index.html`
2. `API_MANUAL_TEST_GUIDE.md` - Endpoint testing
3. `FINAL_STATUS.md` - Complete overview
4. `BACKEND_AUDIT_REPORT.md` - Technical details

### Common Issues
- **Port in use:** Change `PORT` in `.env`
- **DB connection:** Check PostgreSQL running
- **Token expired:** Login again to get new token
- **Swagger 404:** Run `swag init` first

---

## ✅ Checklist

Before starting development:
- [ ] Go 1.24+ installed
- [ ] PostgreSQL 15+ running
- [ ] Database created
- [ ] `.env` configured
- [ ] Admin seeded
- [ ] Server running
- [ ] Login tested
- [ ] Swagger accessible
- [ ] Postman collection imported

---

**🚀 You're ready to go! Happy coding!**

*For detailed information, see: `FINAL_STATUS.md`*
