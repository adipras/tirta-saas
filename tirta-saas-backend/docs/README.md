# 📚 API Documentation

## Available Documentation

### 1. Swagger UI (Limited)
**URL**: `http://localhost:8081/swagger/index.html`

Currently only shows **4 endpoints** with complete Swagger annotations:
- `POST /auth/platform-owner/register` - Platform owner registration
- `POST /api/tenant-users` - Create tenant user
- `GET /api/tenant-users` - List tenant users
- `PUT /api/tenant-users/:id` - Update tenant user
- `DELETE /api/tenant-users/:id` - Delete tenant user

**Note**: Most endpoints (88+) are functional but lack Swagger annotations. Adding full Swagger documentation is optional for production.

### 2. Postman Collection (Recommended)
**Files**:
- `Tirta-SaaS-Backend.postman_collection.json` - API collection
- `Tirta-SaaS-Environment.postman_environment.json` - Environment variables

**Generate**: Run `./scripts/generate-postman.sh`

Currently includes the 4 documented endpoints. For complete testing, use the manual testing guide.

### 3. Manual Testing Guide (Complete)
**File**: `../API_TESTING_GUIDE.md`

Comprehensive guide with **92+ API endpoints** including:
- Request examples with curl
- Request/response samples
- Testing workflows
- All endpoints are functional

**This is the most complete reference** for all available APIs.

### 4. Quick Reference
**File**: `../API_QUICK_REFERENCE.md`

Quick lookup for all endpoints with:
- HTTP methods
- Authentication requirements
- Query parameters
- Brief descriptions

---

## 🚀 Quick Start

### Option 1: Manual Testing (Recommended)
Follow `API_TESTING_GUIDE.md` for step-by-step testing of all 92+ endpoints.

### Option 2: Swagger UI (Limited)
```
http://localhost:8081/swagger/index.html
```
Only 4 endpoints documented, but you can test them interactively.

### Option 3: Postman (Partial)
```bash
# Generate collection
./scripts/generate-postman.sh

# Import into Postman
1. Import Tirta-SaaS-Backend.postman_collection.json
2. Import Tirta-SaaS-Environment.postman_environment.json
3. Set environment to "Tirta SaaS Environment"
```

### Option 4: curl (Complete)
All examples in `API_TESTING_GUIDE.md` use curl commands that you can copy and run.

---

## 📝 Adding Full Swagger Documentation (Optional)

To add Swagger annotations for remaining 88+ endpoints:

### 1. Add annotations to controllers
```go
// @Summary Register new tenant
// @Description Register a water utility company as new tenant
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 200 {object} RegisterResponse
// @Failure 400 {object} ErrorResponse
// @Router /auth/register [post]
func Register(c *gin.Context) {
    // implementation
}
```

### 2. Regenerate swagger
```bash
~/go/bin/swag init -g main.go --output ./docs
```

### 3. Regenerate Postman
```bash
./scripts/generate-postman.sh
```

**Estimated Time**: 4-6 hours for all 92+ endpoints

**Priority**: Low - All endpoints are functional and documented in `API_TESTING_GUIDE.md`

---

## 📊 Documentation Coverage

| Documentation Type | Coverage | Status |
|-------------------|----------|---------|
| Functional Code | 92+ endpoints | ✅ 100% Complete |
| Manual Testing Guide | 92+ endpoints | ✅ 100% Complete |
| Quick Reference | 92+ endpoints | ✅ 100% Complete |
| Swagger Annotations | 4 endpoints | ⚠️ 4% Complete |
| Postman Collection | 4 endpoints | ⚠️ 4% Complete |

---

## 🎯 Recommendation

**For Production Deployment**: Use the **Manual Testing Guide** and **Quick Reference** as primary documentation. They are complete and cover all functionality.

**Swagger/Postman**: Nice-to-have for interactive testing, but not required since all endpoints are fully documented in markdown files.

---

## 📞 Support

For API questions:
1. Check `API_TESTING_GUIDE.md` first
2. Review `API_QUICK_REFERENCE.md` for endpoint list
3. Test with provided curl examples

---

*Last Updated: December 16, 2025*
