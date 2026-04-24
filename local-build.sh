#!/bin/bash

set -e  # Exit on any error

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist/macos-arm64

echo "🔨 Building frontend..."
(cd frontend && npm run build)

echo "🔨 Building Rust binaries..."
cargo build --release --manifest-path Cargo.toml

echo "📦 Creating distribution package..."

# Copy the main binary
cp target/release/server viboard
zip -q viboard.zip viboard
rm -f viboard
mv viboard.zip npx-cli/dist/macos-arm64/viboard.zip

echo "✅ NPM package ready!"
echo "📁 Files created:"
echo "   - npx-cli/dist/macos-arm64/viboard.zip"
