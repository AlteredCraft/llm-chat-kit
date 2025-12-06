# LLM Chat Kit

A lightweight, reusable LLM chat interface for research projects.

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment template and add your API keys
cp .env.example .env

# Run tests
bun run test           # Run all tests with coverage
bun run test:unit      # Unit tests only
bun run test:integ     # Integration tests only
bun run test:watch     # Watch mode for development

# Start development server
bun run dev
```

Open http://localhost:3000 in your browser.

## Configuration

### Providers

Edit `config/providers.config.js` to enable/disable providers and set defaults.

### System Prompts

- Default prompts: `config/prompts.default.json` (tracked in git)
- User prompts: `data/prompts.user.json` (gitignored, created at runtime)

### API Keys

Add your API keys to `.env`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Ollama runs locally and doesn't need an API key.

## License

MIT
