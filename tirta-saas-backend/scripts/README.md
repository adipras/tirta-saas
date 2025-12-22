# 🛠️ Utility Scripts

This folder contains utility scripts for development and deployment.

---

## 📜 Available Scripts

### 1. generate-postman.sh
**Purpose**: Generate Postman collection from Swagger documentation

**Usage**:
```bash
./scripts/generate-postman.sh
```

**What it does**:
1. Checks prerequisites (Go, Node.js, npm)
2. Installs required tools (swag, openapi-to-postmanv2)
3. Generates Swagger documentation
4. Converts Swagger to Postman collection
5. Creates Postman environment file

**Output**:
- `docs/swagger.json` - OpenAPI 2.0 specification
- `docs/swagger.yaml` - OpenAPI YAML format
- `docs/Tirta-SaaS-Backend.postman_collection.json` - Postman collection
- `docs/Tirta-SaaS-Environment.postman_environment.json` - Environment variables

**Requirements**:
- Go 1.21+
- Node.js and npm
- Internet connection (for first-time npm install)

---

### 2. test_migration.go
**Purpose**: Test database connection and run migrations standalone

**Usage**:
```bash
# Make sure .env is configured
cd scripts
go run test_migration.go
```

**What it does**:
1. Loads environment variables from .env
2. Tests database connection
3. Runs all migrations
4. Shows database statistics
5. Verifies setup is correct

**Output**:
```
🔄 Testing Database Connection and Migration...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Connecting to database...
✅ Database connected successfully

🚀 Running migrations...
✅ Migration test completed successfully!

📊 Database Status:
   • Total tables: 16
   • Permissions seeded: 22

🎉 Database is ready for use!
```

**When to use**:
- Testing database setup before running main app
- Troubleshooting connection issues
- Verifying migrations work correctly
- Fresh database setup

---

## 🔧 Development Workflow

### First Time Setup
```bash
# 1. Setup database
createdb tirta_saas_db

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Test database connection
cd scripts
go run test_migration.go

# 4. Generate Postman collection
cd ..
./scripts/generate-postman.sh
```

### Regular Development
```bash
# Regenerate Postman collection after API changes
./scripts/generate-postman.sh

# Test migrations after model changes
cd scripts && go run test_migration.go
```

---

## 📝 Adding New Scripts

When adding new scripts to this folder:

1. **Name clearly**: Use descriptive names (verb-noun format)
2. **Add shebang**: Start bash scripts with `#!/bin/bash`
3. **Make executable**: `chmod +x script-name.sh`
4. **Document here**: Update this README with usage
5. **Add comments**: Explain what the script does

Example:
```bash
#!/bin/bash
# Purpose: Brief description
# Usage: ./script-name.sh [args]

# Your script code here
```

---

## 📞 Support

For script issues:
1. Check prerequisites are installed
2. Verify .env configuration
3. Review script output for errors
4. Check main documentation

---

*Last Updated: December 16, 2025*
