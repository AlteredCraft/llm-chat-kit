# Basic Chat UI — Design Specification

A lightweight, reusable LLM chat interface for research projects.

**License:** MIT
**Default Branding:** Altered Craft (white-label friendly)

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Technical Stack & Project Structure](#2-technical-stack--project-structure)
3. [Configuration System](#3-configuration-system)
4. [Bun Server / API Layer](#4-bun-server--api-layer)
5. [UI Components (Lit)](#5-ui-components-lit)
6. [State Management & Data Flow](#6-state-management--data-flow)
7. [MVP v1 Feature Details](#7-mvp-v1-feature-details)
8. [Visual Design & Future Considerations](#8-visual-design--future-considerations)
9. [Research Links](#9-research-links)

---

## 1. Overview & Architecture

### Project Summary

A lightweight, reusable LLM chat UI built for easy forking and adaptation across research projects. The design prioritizes simplicity, modularity, and clear abstraction boundaries so developers can quickly customize it for their needs.

### High-Level Architecture

```
+-----------------------------------------------------+
|                   Browser (Client)                  |
|  +---------------+  +---------------------------+   |
|  |  Chat View    |  |   Settings Sidebar        |   |
|  |  (Lit)        |  |   (Lit)                   |   |
|  |               |  |   - Provider/Model        |   |
|  |  - Messages   |  |   - Hyperparameters       |   |
|  |  - Input      |  |   - System Prompts        |   |
|  +-------+-------+  +-----------+---------------+   |
|          |    localStorage      |                   |
|          |   (conversation)     |                   |
|          +----------+-----------+                   |
|                     | HTTP/SSE                      |
+---------------------+-------------------------------+
                      |
+---------------------+-------------------------------+
|              Bun Server (Proxy)                     |
|                     |                               |
|  +------------------+---------------------------+   |
|  |           Vercel AI SDK                      |   |
|  |   +--------+--------+--------+--------+      |   |
|  |   | OpenAI |Anthropic| Gemini | Ollama |     |   |
|  |   +--------+--------+--------+--------+      |   |
|  +----------------------------------------------+   |
|                                                     |
|  Config Files:          Data Files:                 |
|  - providers.config.js  - prompts.user.json         |
|  - prompts.default.json - .env (API keys)           |
+-----------------------------------------------------+
```

### Key Architectural Decisions

- **Thin proxy pattern**: Bun server only proxies LLM calls and manages prompt files—no auth, no database
- **Config-driven**: Forkers customize behavior through config files, not code changes
- **Client-side conversation state**: localStorage keeps it simple; no server-side session management
- **Streaming-first**: All LLM responses stream via Server-Sent Events (SSE)

---

## 2. Technical Stack & Project Structure

### Runtime & Tooling

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Bun | Fast startup, built-in TypeScript, simple install |
| UI Components | Lit (~5KB) | Lightweight Web Components, reactive properties for streaming |
| LLM Integration | Vercel AI SDK | Unified API across providers, built-in streaming support |
| Styling | CSS (vanilla) | No framework; CSS custom properties for theming |

### Project Structure

```
basic-chat-ui/
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── chat-app.ts          # Root component, layout orchestration
│   │   │   ├── chat-view.ts         # Message list + input
│   │   │   ├── chat-message.ts      # Single message bubble
│   │   │   ├── chat-input.ts        # Text input + send button
│   │   │   ├── settings-panel.ts    # Sidebar container
│   │   │   ├── provider-select.ts   # Provider/model dropdowns
│   │   │   ├── param-controls.ts    # Temperature, max tokens, etc.
│   │   │   └── prompt-manager.ts    # System prompt CRUD
│   │   ├── services/
│   │   │   ├── api.ts               # HTTP client for Bun server
│   │   │   └── storage.ts           # localStorage wrapper
│   │   ├── styles/
│   │   │   └── theme.css            # CSS custom properties, base styles
│   │   └── index.html               # Entry point
│   │
│   └── server/
│       ├── index.ts                 # Bun server entry
│       ├── routes/
│       │   ├── chat.ts              # POST /api/chat -> LLM streaming
│       │   ├── prompts.ts           # GET/POST/PUT/DELETE /api/prompts
│       │   └── models.ts            # GET /api/models/:provider
│       └── lib/
│           ├── providers.ts         # Vercel AI SDK provider setup
│           └── config.ts            # Config file loaders
│
├── config/
│   ├── providers.config.js          # Enabled providers & models
│   └── prompts.default.json         # Default system prompts
│
├── data/
│   └── prompts.user.json            # User-created prompts (gitignored)
│
├── .env.example                     # Template for API keys
├── .env                             # Actual API keys (gitignored)
├── .gitignore
├── package.json
├── bunfig.toml                      # Bun configuration
└── README.md
```

### Key Conventions

- `src/client/` — Everything that runs in the browser
- `src/server/` — Bun server code only
- `config/` — Tracked configuration files forkers customize
- `data/` — Runtime data files, gitignored

---

## 3. Configuration System

### Configuration Files

| File | Purpose | Tracked in Git? | Who Edits |
|------|---------|-----------------|-----------|
| `config/providers.config.js` | Enable providers, set defaults, doc links | Yes | Forkers |
| `config/prompts.default.json` | Ship default system prompts | Yes | Forkers |
| `data/prompts.user.json` | User-created prompts at runtime | No | End users (via UI) |
| `.env` | API keys | No | End users |

### providers.config.js

```js
export default {
  providers: {
    openai: {
      enabled: true,
      docsUrl: 'https://platform.openai.com/docs/models'
    },
    anthropic: {
      enabled: true,
      docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    google: {
      enabled: true,
      docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434',
      docsUrl: 'https://ollama.com/library'
    }
  },
  defaults: {
    provider: 'ollama',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 2048
  }
}
```

### Model Selection UX

- **Ollama**: Dropdown auto-populated from `/api/tags` (locally installed models)
- **Cloud providers**: Text input for model ID + link to provider's model docs
- Settings persist in localStorage (selected provider, model, hyperparameters)

### prompts.default.json

```json
[
  {
    "id": "default",
    "name": "Default Assistant",
    "prompt": "You are a helpful assistant.",
    "isDefault": true
  },
  {
    "id": "research",
    "name": "Research Helper",
    "prompt": "You are a research assistant. Be thorough and cite your reasoning.",
    "isDefault": false
  }
]
```

### prompts.user.json (created at runtime)

```json
[
  {
    "id": "user-1732847293",
    "name": "My Custom Prompt",
    "prompt": "You are a creative writing partner...",
    "isDefault": false,
    "createdAt": "2024-11-29T..."
  }
]
```

### .env.example (committed as template)

```bash
# Copy to .env and fill in your keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
# Ollama runs locally, no key needed
```

### Forker Workflow

1. Fork the repo
2. Edit `config/providers.config.js` to enable only the providers they need
3. Replace `config/prompts.default.json` with project-specific prompts
4. Commit and share—users just add their `.env` and run

---

## 4. Bun Server / API Layer

### Overview

A thin Bun server with three responsibilities:

1. Proxy LLM requests (keeps API keys server-side)
2. Manage system prompt files (read/write to disk)
3. Serve static client files

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/chat` | Stream chat completion via SSE |
| `GET` | `/api/prompts` | Get all prompts (default + user) |
| `POST` | `/api/prompts` | Create new user prompt |
| `PUT` | `/api/prompts/:id` | Update user prompt |
| `DELETE` | `/api/prompts/:id` | Delete user prompt |
| `GET` | `/api/models/:provider` | Get available models for a provider |

### POST /api/chat — Request

```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "maxTokens": 2048
}
```

### POST /api/chat — Response (SSE stream)

```
data: {"type":"text-delta","content":"Hello"}
data: {"type":"text-delta","content":"! How"}
data: {"type":"text-delta","content":" can I help?"}
data: {"type":"finish","reason":"stop"}
```

### GET /api/models/:provider — Response

```json
// GET /api/models/ollama
{ "supported": true, "models": ["llama3", "mistral", "codellama"] }

// GET /api/models/openai
{ "supported": false, "docsUrl": "https://platform.openai.com/docs/models" }
```

### Server Implementation

```typescript
// src/server/index.ts
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { chatRoute } from './routes/chat';
import { promptsRoute } from './routes/prompts';
import { modelsRoute } from './routes/models';

const app = new Hono();

// API routes
app.route('/api/chat', chatRoute);
app.route('/api/prompts', promptsRoute);
app.route('/api/models', modelsRoute);

// Static files (client)
app.get('/*', serveStatic({ root: './dist/client' }));

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

### Provider Routing (using Vercel AI SDK)

```typescript
// src/server/lib/providers.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';

export function getModel(provider: string, modelId: string) {
  switch (provider) {
    case 'openai': return openai(modelId);
    case 'anthropic': return anthropic(modelId);
    case 'google': return google(modelId);
    case 'ollama': return ollama(modelId);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### Key Design Notes

- **Hono**: Lightweight web framework that pairs well with Bun (~14KB)
- **SSE for streaming**: Standard approach, works with `streamText()` from Vercel AI SDK
- **No auth**: MVP v1 assumes single-user local/trusted deployment
- **Error handling**: Provider errors forwarded to client with type/message

---

## 5. UI Components (Lit)

### Component Hierarchy

```
<chat-app>                      # Root: layout, state orchestration
├── <chat-view>                 # Main chat area
│   ├── <message-list>          # Scrollable message container
│   │   └── <chat-message>      # Individual message bubble (x n)
│   └── <chat-input>            # Text input + send button
│
└── <settings-panel>            # Slide-out sidebar
    ├── <provider-select>       # Provider dropdown + model input/dropdown
    ├── <param-controls>        # Temperature, max tokens sliders
    └── <prompt-manager>        # System prompt list + CRUD
```

### Component Responsibilities

| Component | Responsibilities |
|-----------|------------------|
| `chat-app` | Layout grid, toggle settings visibility, hold shared state |
| `chat-view` | Manage message array, handle send action, coordinate streaming |
| `message-list` | Render messages, auto-scroll on new content |
| `chat-message` | Display single message (role, content), preserve line breaks |
| `chat-input` | Textarea, send button, disable during streaming, handle Enter key |
| `settings-panel` | Sidebar container, open/close animation |
| `provider-select` | Provider dropdown, model input (or dropdown for Ollama) |
| `param-controls` | Sliders/inputs for temperature, maxTokens |
| `prompt-manager` | List prompts, select active, create/edit/delete user prompts |

### State Management Approach

Lit's reactive properties handle most needs. For cross-component state:

- **Props down**: Parent passes settings to children
- **Events up**: Children emit custom events (`settings-changed`, `prompt-selected`)
- **localStorage**: Persists settings and conversation on change

### Sample Component

```typescript
// src/client/components/chat-message.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('chat-message')
export class ChatMessage extends LitElement {
  @property() role: 'user' | 'assistant' = 'user';
  @property() content: string = '';

  static styles = css`
    :host {
      display: block;
      margin: 0.5rem 0;
    }
    .message {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      white-space: pre-wrap;  /* Preserve line breaks */
    }
    .user {
      background: var(--color-user-bg, #f0f0f0);
      margin-left: 2rem;
    }
    .assistant {
      background: var(--color-assistant-bg, #ffffff);
      margin-right: 2rem;
      border: var(--border-width) solid var(--color-border);
    }
  `;

  render() {
    return html`
      <div class="message ${this.role}">${this.content}</div>
    `;
  }
}
```

### Streaming Integration

```typescript
async sendMessage(userInput: string) {
  // Add user message
  this.messages = [...this.messages, { role: 'user', content: userInput }];

  // Add empty assistant message (will stream into this)
  this.messages = [...this.messages, { role: 'assistant', content: '' }];

  const response = await fetch('/api/chat', { /* ... */ });
  const reader = response.body.getReader();

  // Stream chunks into last message
  for await (const chunk of parseSSE(reader)) {
    if (chunk.type === 'text-delta') {
      this.updateLastMessage(chunk.content);
    }
  }
}
```

---

## 6. State Management & Data Flow

### State Locations

| State | Location | Persistence |
|-------|----------|-------------|
| Conversation messages | `chat-view` component | localStorage |
| Settings (provider, model, params) | `chat-app` component | localStorage |
| Active system prompt | `chat-app` component | localStorage |
| Default prompts | Server (file) | `config/prompts.default.json` |
| User prompts | Server (file) | `data/prompts.user.json` |
| Settings panel open/closed | `chat-app` component | None (resets on refresh) |
| Streaming in progress | `chat-view` component | None |

### Data Flow Diagram

```
                    +--------------------------------------+
                    |            localStorage              |
                    |  +------------+  +---------------+   |
                    |  | settings   |  | conversation  |   |
                    |  +-----+------+  +-------+-------+   |
                    +--------+------------------+----------+
                       load | ^ save       load | ^ save
+-----------------------------------------------------------+
|                        chat-app                           |
|                                                           |
|  settings ---------+------------------+                   |
|  activePrompt -----+                  |                   |
|                    v                  v                   |
|  +---------------------+  +-------------------------+     |
|  |     chat-view       |  |    settings-panel       |     |
|  |                     |  |                         |     |
|  | <- streaming chunks |  | provider-select         |     |
|  |                     |  | param-controls          |     |
|  | conversation ------------> prompt-manager        |     |
|  |   (local state)     |  |                         |     |
|  +----------+----------+  +-------------+-----------+     |
|             |                           |                 |
|             |    Custom Events          |                 |
|             |  <- settings-changed -----+                 |
|             |  <- prompt-selected                         |
|             |  <- prompt-created                          |
+-------------+---------------------------------------------+
                             |
                             v HTTP
+------------------------------------------------------------+
|                      Bun Server                            |
|   /api/chat <---- POST (stream response)                   |
|   /api/prompts <- GET/POST/PUT/DELETE                      |
|   /api/models/:provider <- GET                             |
+------------------------------------------------------------+
```

### localStorage Schema

```typescript
// Key: 'chat-ui-settings'
interface StoredSettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  activePromptId: string;
}

// Key: 'chat-ui-conversation'
interface StoredConversation {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  updatedAt: number;
}
```

### Event Contracts

```typescript
// settings-panel emits:
'settings-changed' -> { provider, model, temperature, maxTokens }
'prompt-selected'  -> { promptId }
'prompt-created'   -> { prompt: Prompt }  // After server confirms
'prompt-deleted'   -> { promptId }

// chat-view emits:
'conversation-cleared' -> {}
```

### Initialization Flow

1. `chat-app` mounts
2. Load settings from localStorage (or use defaults from config)
3. Load conversation from localStorage (or start empty)
4. Fetch prompts from `/api/prompts` (merge default + user)
5. If Ollama selected, fetch models from `/api/models/ollama`
6. Render ready

---

## 7. MVP v1 Feature Details

### Feature Checklist

| Feature | Description | Status |
|---------|-------------|--------|
| Chat interface | Send messages, view responses | MVP v1 |
| Streaming responses | Real-time token display via SSE | MVP v1 |
| Provider switching | Select OpenAI, Anthropic, Gemini, or Ollama | MVP v1 |
| Model selection | Text input (cloud) or dropdown (Ollama) | MVP v1 |
| Hyperparameters | Temperature and max tokens controls | MVP v1 |
| System prompts | Select, create, edit, delete | MVP v1 |
| Conversation persistence | Survives page refresh | MVP v1 |
| Clear conversation | Start fresh with one click | MVP v1 |
| Settings persistence | Provider/model/params saved | MVP v1 |

### Chat Interface Details

- Messages display with role distinction (user right-aligned, assistant left-aligned)
- Line breaks preserved (`white-space: pre-wrap`)
- Auto-scroll to bottom on new messages
- Send via button or Enter key (Shift+Enter for newline)
- Input disabled while streaming
- Visual indicator during streaming (pulsing cursor or similar)

### Settings Panel Layout

```
+----------------------------------+
| Settings                     [x] |
+----------------------------------+
| Provider                         |
| +------------------------------+ |
| | Anthropic                  v | |
| +------------------------------+ |
|                                  |
| Model                            |
| +------------------------------+ |
| | claude-sonnet-4-20250514     | |
| +------------------------------+ |
| > View available models          |
|                                  |
+----------------------------------+
| Temperature               0.7    |
| o-----------*-----------o        |
| 0                           2    |
|                                  |
| Max Tokens               2048    |
| o-----*-----------------o        |
| 256                       8192   |
|                                  |
+----------------------------------+
| System Prompt                    |
|                                  |
| (*) Default Assistant            |
| ( ) Research Helper              |
| ( ) My Custom Prompt        [e]  |
|                                  |
| [+ New Prompt]                   |
+----------------------------------+
```

### System Prompt Management

| Action | Behavior |
|--------|----------|
| Select | Radio button, immediately applies to next message |
| Create | Opens inline form (name + textarea), saves to server |
| Edit | Only user prompts editable, inline editing |
| Delete | Only user prompts deletable, confirm before delete |

### Error Handling

| Error | User Feedback |
|-------|---------------|
| Invalid API key | Toast: "API key invalid for [provider]. Check your .env file." |
| Model not found | Toast: "Model [id] not available. Check the model name." |
| Ollama not running | Toast: "Cannot connect to Ollama at localhost:11434" |
| Network error | Toast: "Connection failed. Check your network." |
| Rate limit | Toast: "Rate limited by [provider]. Wait and retry." |

Errors display as dismissible toast notifications, non-blocking.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | Newline in input |
| `Esc` | Close settings panel |
| `Ctrl/Cmd+,` | Toggle settings panel |

---

## 8. Visual Design & Future Considerations

### Visual Direction

Line-art aesthetic: clean, monochrome, technical, accessible.

| Aspect | Approach |
|--------|----------|
| Palette | Monochrome—black, white, 2-3 gray shades |
| Borders | Thin (1px) solid lines, no shadows |
| Icons | Line-based SVG icons (Lucide, Feather, or custom) |
| Typography | System fonts, clear hierarchy, high contrast |
| Backgrounds | Clean white/off-white, optional subtle grid texture |
| Accessibility | WCAG AA contrast, focus states, keyboard navigable |

### CSS Custom Properties (Theming)

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-border: #1a1a1a;
  --color-muted: #6b6b6b;
  --color-user-bg: #f0f0f0;
  --color-assistant-bg: #ffffff;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;

  /* Borders */
  --border-width: 1px;
  --border-radius: 2px;  /* Minimal rounding */
}
```

White-labelers override these variables to theme the entire app.

### MVP v2 Candidates

| Feature | Description | Complexity |
|---------|-------------|------------|
| Multi-conversation | Sidebar with conversation history | Medium |
| Markdown rendering | Parse markdown in responses | Low |
| Code highlighting | Syntax highlighting in code blocks | Low |
| Function calling | Tool use / integrations | High |
| Export conversation | Download as JSON/text | Low |
| Dynamic model lists | Fetch models for all providers | Medium |
| Dark mode | Inverted color scheme | Low |
| File attachments | Upload context documents | High |

### Recommended MVP v2 Priorities

1. Markdown + code highlighting (quick wins, high impact)
2. Multi-conversation (natural progression)
3. Export conversation (easy, useful)
4. Function calling (when integration needs arise)

---

## 9. Research Links

### Core Technologies

- **Bun** — https://bun.sh/docs
- **Lit** — https://lit.dev/docs/
- **Vercel AI SDK** — https://sdk.vercel.ai/docs
- **Hono** — https://hono.dev/docs

### LLM Provider Documentation

- **OpenAI Models** — https://platform.openai.com/docs/models
- **Anthropic Models** — https://docs.anthropic.com/en/docs/about-claude/models
- **Google Gemini Models** — https://ai.google.dev/gemini-api/docs/models
- **Ollama** — https://ollama.com/library

### Vercel AI SDK Providers

- **@ai-sdk/openai** — https://sdk.vercel.ai/providers/ai-sdk-providers/openai
- **@ai-sdk/anthropic** — https://sdk.vercel.ai/providers/ai-sdk-providers/anthropic
- **@ai-sdk/google** — https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
- **ollama-ai-provider** — https://sdk.vercel.ai/providers/community-providers/ollama

### Icon Libraries (Line-based)

- **Lucide** — https://lucide.dev/
- **Feather Icons** — https://feathericons.com/

### Accessibility

- **WCAG Guidelines** — https://www.w3.org/WAI/WCAG21/quickref/
