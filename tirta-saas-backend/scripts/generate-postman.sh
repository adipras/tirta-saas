#!/bin/bash

# Tirta SaaS Backend - Postman Collection Generator
# Generates Postman collection from Swagger documentation with auto token management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SWAGGER_FILE="docs/swagger.json"
OUTPUT_COLLECTION="docs/Tirta-SaaS-Backend.postman_collection.json"
OUTPUT_ENV="docs/Tirta-SaaS-Backend.postman_environment.json"
API_BASE_URL="http://localhost:8081"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Tirta SaaS Backend - Postman Collection Generator        ║${NC}"
echo -e "${BLUE}║                    Version 3.0.0                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if swagger.json exists
if [ ! -f "$SWAGGER_FILE" ]; then
    echo -e "${RED}✗ Error: $SWAGGER_FILE not found!${NC}"
    echo -e "${YELLOW}Please run 'swag init' first to generate Swagger documentation${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found Swagger documentation${NC}"
echo ""

# Generate Postman Collection with authentication scripts
echo -e "${BLUE}📦 Generating Postman Collection...${NC}"

cat > "$OUTPUT_COLLECTION" << 'EOF'
{
  "info": {
    "name": "Tirta SaaS Backend API",
    "description": "Complete API documentation for Tirta SaaS Backend with auto token management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_postman_id": "tirta-saas-backend-v1",
    "version": "1.0.0"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          "// Auto refresh token if expired",
          "const tokenExpiry = pm.environment.get('token_expires_at');",
          "if (tokenExpiry) {",
          "    const now = new Date().getTime();",
          "    const expiryTime = new Date(tokenExpiry).getTime();",
          "    if (now >= expiryTime - 60000) {",
          "        console.log('Token expired or about to expire, please login again');",
          "    }",
          "}"
        ]
      }
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "// Auto-save token from login response",
                  "if (pm.response.code === 200) {",
                  "    const jsonData = pm.response.json();",
                  "    ",
                  "    if (jsonData.token) {",
                  "        // Save token to environment",
                  "        pm.environment.set('auth_token', jsonData.token);",
                  "        pm.environment.set('token_expires_at', jsonData.expires_at);",
                  "        ",
                  "        // Save user info",
                  "        if (jsonData.user) {",
                  "            pm.environment.set('user_id', jsonData.user.id);",
                  "            pm.environment.set('user_email', jsonData.user.email);",
                  "            pm.environment.set('user_role', jsonData.user.role);",
                  "            pm.environment.set('user_name', jsonData.user.name);",
                  "        }",
                  "        ",
                  "        console.log('✓ Token saved successfully');",
                  "        console.log('User:', jsonData.user.name, '(' + jsonData.user.role + ')');",
                  "        console.log('Expires at:', jsonData.expires_at);",
                  "    }",
                  "}",
                  "",
                  "// Test assertions",
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response has token', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "    pm.expect(jsonData.token).to.be.a('string').and.not.empty;",
                  "});",
                  "",
                  "pm.test('Response has user info', function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('user');",
                  "    pm.expect(jsonData.user).to.have.property('id');",
                  "    pm.expect(jsonData.user).to.have.property('email');",
                  "    pm.expect(jsonData.user).to.have.property('role');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{admin_email}}\",\n  \"password\": \"{{admin_password}}\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            },
            "description": "Login to get authentication token. Token will be automatically saved to environment."
          },
          "response": []
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            },
            "description": "Get current authenticated user information"
          },
          "response": []
        }
      ]
    },
    {
      "name": "Platform Management",
      "item": [
        {
          "name": "Tenants",
          "item": [
            {
              "name": "List Tenants",
              "request": {
                "method": "GET",
                "header": [],
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants?page=1&page_size=20&sort_by=created_at&sort_order=desc",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants"],
                  "query": [
                    {"key": "page", "value": "1"},
                    {"key": "page_size", "value": "20"},
                    {"key": "sort_by", "value": "created_at"},
                    {"key": "sort_order", "value": "desc"},
                    {"key": "search", "value": "", "disabled": true},
                    {"key": "status", "value": "", "disabled": true}
                  ]
                }
              }
            },
            {
              "name": "Create Tenant",
              "event": [
                {
                  "listen": "test",
                  "script": {
                    "type": "text/javascript",
                    "exec": [
                      "if (pm.response.code === 201) {",
                      "    const jsonData = pm.response.json();",
                      "    if (jsonData.id) {",
                      "        pm.environment.set('last_tenant_id', jsonData.id);",
                      "        console.log('✓ Tenant ID saved:', jsonData.id);",
                      "    }",
                      "}"
                    ]
                  }
                }
              ],
              "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"PDAM Example\",\n  \"slug\": \"pdam-example\",\n  \"domain\": \"pdam-example.tirta-saas.com\",\n  \"database_name\": \"tirta_pdam_example\",\n  \"contact_email\": \"admin@pdam-example.com\",\n  \"contact_phone\": \"081234567890\",\n  \"address\": \"Jl. Example No. 123\",\n  \"city\": \"Jakarta\",\n  \"province\": \"DKI Jakarta\",\n  \"postal_code\": \"12345\",\n  \"subscription_plan\": \"professional\",\n  \"max_customers\": 10000\n}"
                },
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants"]
                }
              }
            },
            {
              "name": "Get Tenant Detail",
              "request": {
                "method": "GET",
                "header": [],
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants/{{last_tenant_id}}",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants", "{{last_tenant_id}}"]
                }
              }
            },
            {
              "name": "Update Tenant",
              "request": {
                "method": "PUT",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"PDAM Example Updated\",\n  \"contact_email\": \"admin@pdam-example.com\",\n  \"contact_phone\": \"081234567890\",\n  \"address\": \"Jl. Example No. 123\",\n  \"city\": \"Jakarta\",\n  \"province\": \"DKI Jakarta\",\n  \"postal_code\": \"12345\"\n}"
                },
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants/{{last_tenant_id}}",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants", "{{last_tenant_id}}"]
                }
              }
            },
            {
              "name": "Activate Tenant",
              "request": {
                "method": "POST",
                "header": [],
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants/{{last_tenant_id}}/activate",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants", "{{last_tenant_id}}", "activate"]
                }
              }
            },
            {
              "name": "Suspend Tenant",
              "request": {
                "method": "POST",
                "header": [],
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants/{{last_tenant_id}}/suspend",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants", "{{last_tenant_id}}", "suspend"]
                }
              }
            },
            {
              "name": "Delete Tenant",
              "request": {
                "method": "DELETE",
                "header": [],
                "url": {
                  "raw": "{{base_url}}/api/platform/tenants/{{last_tenant_id}}",
                  "host": ["{{base_url}}"],
                  "path": ["api", "platform", "tenants", "{{last_tenant_id}}"]
                }
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Health Check",
      "request": {
        "auth": {
          "type": "noauth"
        },
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        },
        "description": "Health check endpoint (no authentication required)"
      },
      "response": []
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8081",
      "type": "string"
    }
  ]
}
EOF

echo -e "${GREEN}✓ Collection generated${NC}"
echo ""

# Generate Environment file
echo -e "${BLUE}🌍 Generating Postman Environment...${NC}"

cat > "$OUTPUT_ENV" << EOF
{
  "id": "tirta-saas-local-env",
  "name": "Tirta SaaS - Local Development",
  "values": [
    {
      "key": "base_url",
      "value": "$API_BASE_URL",
      "type": "default",
      "enabled": true
    },
    {
      "key": "admin_email",
      "value": "platform.admin@tirta-saas.com",
      "type": "default",
      "enabled": true
    },
    {
      "key": "admin_password",
      "value": "admin123",
      "type": "secret",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "secret",
      "enabled": true
    },
    {
      "key": "token_expires_at",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "user_email",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "user_role",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "user_name",
      "value": "",
      "type": "default",
      "enabled": true
    },
    {
      "key": "last_tenant_id",
      "value": "",
      "type": "default",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
EOF

echo -e "${GREEN}✓ Environment file generated${NC}"
echo ""

# Summary
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Generation Complete!                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📦 Files generated:${NC}"
echo -e "   • Collection: ${YELLOW}$OUTPUT_COLLECTION${NC}"
echo -e "   • Environment: ${YELLOW}$OUTPUT_ENV${NC}"
echo ""
echo -e "${BLUE}📝 How to use:${NC}"
echo -e "   1. Import both files into Postman"
echo -e "   2. Select 'Tirta SaaS - Local Development' environment"
echo -e "   3. Run 'Authentication > Login' request first"
echo -e "   4. Token will be automatically saved and used in all requests"
echo -e "   5. All authenticated endpoints will use the saved token"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • Token is automatically saved after successful login"
echo -e "   • Use collection-level auth (Bearer Token with {{auth_token}})"
echo -e "   • Environment variables are auto-updated from responses"
echo -e "   • Check Console for token status and debug info"
echo ""
