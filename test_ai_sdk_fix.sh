#!/bin/bash

# Test script to verify AI SDK v2 compatibility fix
# This script tests the chat API with Anthropic provider

echo "🧪 Testing AI SDK v2 Compatibility Fix"
echo "======================================"

# Test 1: Check dependencies
echo "📦 Checking dependency versions..."
bun list | grep -E "@ai-sdk|ai|zod" | while read line; do
    echo "  $line"
done

echo ""

# Test 2: Run unit tests
echo "🔬 Running unit tests..."
bun test tests/unit/startup.test.ts tests/unit/providers.test.ts

if [ $? -eq 0 ]; then
    echo "✅ Unit tests passed"
else
    echo "❌ Unit tests failed"
    exit 1
fi

echo ""

# Test 3: Run integration tests
echo "🔗 Running integration tests..."
bun test tests/integ/api.test.ts

if [ $? -eq 0 ]; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    exit 1
fi

echo ""

# Test 4: Test chat API with Anthropic (if server can start)
echo "💬 Testing chat API with Anthropic provider..."

# Create a simple test request
cat > /tmp/test_chat.json << 'EOF'
{
  "provider": "anthropic",
  "model": "claude-haiku-4-5",
  "messages": [
    {
      "role": "user",
      "content": "Hello, this is a test message. Please respond with 'AI SDK v2 test successful'."
    }
  ],
  "temperature": 0.7,
  "maxTokens": 100
}
EOF

# Start server in background and test
PORT=3003 bun run dev:server &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test the API
echo "📡 Sending test request to /api/chat..."
curl -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d @/tmp/test_chat.json \
  --max-time 10 \
  --no-buffer

# Clean up
kill $SERVER_PID 2>/dev/null
rm -f /tmp/test_chat.json

echo ""
echo "🎉 AI SDK v2 compatibility test completed!"