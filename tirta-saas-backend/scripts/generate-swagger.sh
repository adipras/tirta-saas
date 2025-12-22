#!/bin/bash

# Generate Swagger documentation
# This script regenerates API documentation using swaggo

set -e

echo "🔄 Generating Swagger documentation..."

# Check if swag is installed
if ! command -v ~/go/bin/swag &> /dev/null; then
    echo "❌ swag command not found"
    echo "📦 Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
fi

# Generate documentation
~/go/bin/swag init

echo "✅ Swagger documentation generated successfully!"
echo "📄 Files created:"
echo "   - docs/docs.go"
echo "   - docs/swagger.json"
echo "   - docs/swagger.yaml"
echo ""
echo "🌐 Access Swagger UI at: http://localhost:8081/swagger/index.html"
