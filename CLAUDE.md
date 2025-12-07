# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start Vite dev server (client)
bun run dev:server       # Start Bun server with watch mode
bun run build            # Build client and server for production
bun run test             # Run all tests with coverage
bun run test:unit        # Unit tests only
bun run test:integ       # Integration tests only
bun run test:watch       # Watch mode for development
```

Run a single test file:
```bash
bun test tests/unit/startup.test.ts
```

## Architecture

This is a lightweight LLM chat UI using a **thin proxy pattern**:

```
Browser (React + Vite)
    │
    │ HTTP/SSE
    ▼
Bun Server (Hono)
    │
    │ Vercel AI SDK
    ▼
LLM Providers (OpenAI, Anthropic, Google, Ollama)
```

### Key Design Decisions

- **Client-side state**: Conversation and settings stored in localStorage, no server sessions
- **Streaming-first**: All LLM responses stream via SSE using Vercel AI SDK's `streamText()`
- **Config-driven**: Providers enabled/disabled via `config/providers.config.js`, not code changes
- **No auth**: Assumes single-user local/trusted deployment

### Server (`src/server/`)

- `index.ts` - Hono app entry, runs startup checks before serving
- `routes/chat.ts` - POST /api/chat, streams LLM responses
- `routes/prompts.ts` - CRUD for system prompts (default + user)
- `routes/models.ts` - GET /api/models/:provider
- `lib/providers.ts` - Vercel AI SDK provider factory (`getModel()`)
- `lib/startup.ts` - Validates .env, config, providers before starting

### Client (`src/client/`)

React functional components (built with Vite):
- `ChatApp.tsx` - Root layout, holds settings state
- `ChatView.tsx` - Message list + input, handles streaming
- `SettingsPanel.tsx` - Sidebar with provider/model/params/prompts

### Configuration

| File | Purpose |
|------|---------|
| `config/providers.config.js` | Enable providers, set defaults |
| `config/prompts.default.json` | Default system prompts (tracked) |
| `data/prompts.user.json` | User prompts (gitignored, runtime) |
| `.env` | API keys (gitignored) |

## Testing

**IMPORTANT TEST REQUIREMENTS**: 
- Run all tests after completing changes to ensure nothing is broken.
  Report using ✅ or ❌ so it stands out.
- Code coveraage MUST be higher that 80%, it it is not pause and ask the user if we should add more tests or if they want to proceed anyway.
- ensure we don't over mock, we want valuable test that are testing our code not just mocks. Use DI where it makes sense.

Two-tier approach (see `TESTS_STRAT.md` for details):

- **Unit tests** (`tests/unit/`) - Isolated functions with dependency injection
- **Integration tests** (`tests/integ/`) - API endpoints via Hono's in-process test client (no browser)

Startup checks in `lib/startup.ts` accept optional `deps` parameter for testability:
```typescript
runStartupChecks({ env: {}, fileExists: () => false })
```
