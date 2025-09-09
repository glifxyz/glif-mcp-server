#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting release process..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch to release"
    echo "   Current branch: $CURRENT_BRANCH"
    exit 1
fi
echo "✅ On main branch"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Working directory has uncommitted changes"
    exit 1
fi
echo "✅ Working directory is clean"

# Get version from package.json
VERSION=$(jq -r .version package.json)
echo "📦 Current version: $VERSION"

# Sync server.json version if it exists
if [ -f "server.json" ]; then
    echo "🔄 Syncing server.json version..."
    PACKAGE_NAME=$(jq -r .name package.json)
    
    jq --arg version "$VERSION" --arg package "$PACKAGE_NAME" '
        .version = $version |
        .packages = (.packages | map(
            if .registry_type == "npm" and .identifier == $package 
            then .version = $version 
            else . 
            end
        ))
    ' server.json > server.json.tmp && mv server.json.tmp server.json
    
    echo "✅ server.json version synced"
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build the project
echo "🔨 Building project..."
npm run build

# Run type checking
echo "🔍 Type checking..."
npm run typecheck

# Create git tag
echo "🏷️ Creating git tag v$VERSION..."
git tag "v$VERSION"
git push origin --tags

# Create GitHub release with changelog
echo "📝 Creating GitHub release..."
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Generate changelog
PREV_TAG=$(git describe --tags --abbrev=0 "v$VERSION"^ 2>/dev/null || echo "")
if [ -n "$PREV_TAG" ]; then
    LOG_RANGE="$PREV_TAG..HEAD"
else
    LOG_RANGE="HEAD"
fi

NOTES=$(git log --pretty=format:"- [%h](https://github.com/$REPO/commit/%H) %s" "$LOG_RANGE")
gh release create "v$VERSION" --notes "$NOTES"

# Publish to MCP registry if possible
if [ -f "server.json" ]; then
    echo "🌐 Publishing to MCP registry..."
    if mcp-publisher publish 2>/dev/null; then
        echo "✅ Published to MCP registry"
    else
        echo "⚠️ MCP registry publication failed - you may need to publish manually"
        echo "   Run: mcp-publisher publish"
    fi
fi

echo ""
echo "🎉 Release completed successfully!"
echo "   Version: $VERSION"
echo "   Tag: v$VERSION"
echo "   GitHub: https://github.com/$REPO/releases/tag/v$VERSION"

if [ -f "server.json" ]; then
    MCP_NAME=$(jq -r '.mcpName // .name' package.json)
    echo "   MCP Registry: https://registry.modelcontextprotocol.io/servers/$MCP_NAME"
fi

echo ""
echo "📤 NPM publication will be handled by GitHub Actions"