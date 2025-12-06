# Testing Strategy

## Overview

This project uses [Bun's built-in test runner](https://bun.sh/docs/cli/test) with a two-tier testing approach:

- **Unit tests** (`tests/unit/`) - Test individual functions in isolation
- **Integration tests** (`tests/integ/`) - Test API endpoints and component interactions

## Running Tests

```bash
bun run test           # Run all tests with coverage
bun run test:unit      # Unit tests only
bun run test:integ     # Integration tests only
bun run test:watch     # Watch mode for development
```

## Test Structure

```
tests/
├── unit/              # Fast, isolated tests
│   ├── startup.test.ts
│   └── providers.test.ts
└── integ/             # API and integration tests
    └── api.test.ts
```

## Writing Tests

### Basic Test Pattern

```typescript
import { describe, it, expect } from 'bun:test';

describe('Feature Name', () => {
  it('should do something specific', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Testing with Dependencies (Dependency Injection)

For functions that use filesystem, environment variables, or other external dependencies, we use dependency injection to make them testable:

```typescript
// In production code (e.g., startup.ts)
interface StartupDeps {
  env?: Record<string, string | undefined>;
  fileExists?: (path: string) => boolean;
}

export function runStartupChecks(deps: StartupDeps = {}): StartupResult {
  // Use injected deps or fall back to real implementations
  const env = deps.env ?? process.env;
  const fileExists = deps.fileExists ?? existsSync;
  // ... rest of function
}
```

```typescript
// In tests
it('should error when .env file is missing', () => {
  const result = runStartupChecks({
    fileExists: () => false,  // Mock: no files exist
    env: {},                   // Mock: empty environment
  });

  expect(result.canStart).toBe(false);
});
```

This pattern allows:
- Tests to run without real files or API keys
- Full control over test conditions
- No global mocking or monkey-patching needed

### Testing API Endpoints

Use Hono's built-in test client:

```typescript
import { Hono } from 'hono';
import { myRoute } from '../../src/server/routes/myRoute';

const app = new Hono();
app.route('/api/myroute', myRoute);

it('should return 200', async () => {
  const res = await app.request('/api/myroute');
  expect(res.status).toBe(200);

  const data = await res.json();
  expect(data).toHaveProperty('expected');
});
```

## Unit vs Integration: Key Differences

| Aspect | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| **Scope** | Single function | Multiple components working together |
| **Dependencies** | Mocked/injected | Real (or lightly mocked) |
| **Speed** | Very fast (<1ms each) | Slower (HTTP overhead) |
| **Failure diagnosis** | Pinpoints exact function | May need investigation |

### Unit Tests - Isolate Everything

Unit tests verify a single function works correctly. All external dependencies are injected or mocked.

**Example: Testing startup checks**
```typescript
// We don't touch the real filesystem or env
it('should error when .env file is missing', () => {
  const result = runStartupChecks({
    fileExists: () => false,  // Fake filesystem
    env: {},                   // Fake environment
  });
  expect(result.canStart).toBe(false);
});
```

The function under test (`runStartupChecks`) is completely isolated. We control:
- What files "exist"
- What environment variables are "set"
- What config is "loaded"

This means tests are:
- **Deterministic** - Same result every time
- **Fast** - No I/O, no network
- **Debuggable** - Failure = bug in that exact function

### Integration Tests - Real HTTP, No Browser

Integration tests verify that components work together correctly. We simulate HTTP requests using Hono's built-in test client.

**Important:** These are *not* browser tests. There's no browser, no network socket, no running server. Hono's `app.request()` is an in-process HTTP simulator that calls your route handlers directly. Think of it as "what would happen if a client sent this request?" - without actually needing a client.

**Example: Testing the prompts API**
```typescript
// Create a real Hono app with real routes
const app = new Hono();
app.route('/api/prompts', promptsRoute);

it('should return prompts array', async () => {
  // Simulated HTTP request (no network, no browser)
  const res = await app.request('/api/prompts');

  // Real response parsing
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.prompts).toBeArray();
});
```

What's "real" in integration tests:
- HTTP request/response cycle
- Route matching and middleware
- Response serialization (JSON)
- Error handling

What's still mocked:
- External APIs (LLM providers)
- Database connections (if any)

### The Boundary: Where Unit Ends and Integration Begins

```
┌─────────────────────────────────────────────────────────┐
│                    Integration Test                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              HTTP Request                        │    │
│  │  app.request('/api/prompts', { method: 'POST' })│    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Route Handler                       │    │
│  │  promptsRoute.post('/', async (c) => { ... })   │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Business Logic     ◄── Unit Test    │    │
│  │  validatePrompt(), loadPrompts()                │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              JSON Response                       │    │
│  │  { prompts: [...] }                             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

- **Unit tests** target the inner "Business Logic" box
- **Integration tests** cover the full request→response flow

### What Each Test Type Catches

**Unit tests catch:**
- Logic errors in calculations
- Edge cases in validation
- Incorrect return values
- Missing error handling in functions

**Integration tests catch:**
- Wrong HTTP status codes
- Missing/malformed JSON responses
- Route not registered
- Middleware not applied
- Request body parsing issues
- CORS/headers problems

### Not Tested (requires E2E)
- Actual LLM API calls (needs real API keys + costs money)
- Browser rendering (needs Playwright/Puppeteer)
- WebSocket/streaming connections
- Full user workflows

## Coverage

Coverage is enabled by default via `--coverage` flag. Current targets:

| Metric | Target |
|--------|--------|
| Functions | > 80% |
| Lines | > 70% |

Uncovered lines are typically:
- Console output / logging functions
- Error paths that need external services
- Streaming response handlers

## Tips

1. **Keep unit tests fast** - No network calls, no file I/O
2. **Use descriptive test names** - `it('should reject prompt without name')` not `it('test1')`
3. **Test edge cases** - Empty inputs, missing fields, invalid data
4. **One assertion focus** - Each test should verify one behavior
