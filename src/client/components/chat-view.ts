import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import './chat-message.js';
import './chat-input.js';
import { chatApi, type Message } from '../services/api.js';
import { storage } from '../services/storage.js';

@customElement('chat-view')
export class ChatView extends LitElement {
  @property() provider: string = 'ollama';
  @property() model: string = '';
  @property({ type: Number }) temperature: number = 0.7;
  @property({ type: Number }) maxTokens: number = 2048;
  @property() systemPrompt: string = 'You are a helpful assistant.';

  @state() private messages: Message[] = [];
  @state() private isStreaming = false;

  @query('.messages') messagesContainer!: HTMLElement;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-sm) var(--space-md);
      border-bottom: var(--border-width) solid var(--color-border);
    }

    .title {
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: var(--space-sm);
    }

    button {
      padding: var(--space-xs) var(--space-sm);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg);
      color: var(--color-fg);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.875rem;
    }

    button:hover {
      background: var(--color-user-bg);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-md);
    }

    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-muted);
    }

    .input-area {
      padding: var(--space-md);
      border-top: var(--border-width) solid var(--color-border);
    }

    .streaming-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-sm);
      color: var(--color-muted);
      font-size: 0.875rem;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: var(--color-muted);
      border-radius: 50%;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadConversation();
  }

  private loadConversation() {
    const saved = storage.getConversation();
    if (saved) {
      this.messages = saved.messages;
    }
  }

  private saveConversation() {
    storage.saveConversation({
      messages: this.messages,
      updatedAt: Date.now(),
    });
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
    });
  }

  private async handleSendMessage(e: CustomEvent<{ content: string }>) {
    const userContent = e.detail.content;

    // Add user message
    this.messages = [
      ...this.messages,
      { role: 'user', content: userContent, timestamp: Date.now() },
    ];

    // Add empty assistant message for streaming
    this.messages = [
      ...this.messages,
      { role: 'assistant', content: '', timestamp: Date.now() },
    ];

    this.isStreaming = true;
    this.scrollToBottom();
    this.saveConversation();

    try {
      // Build messages array with system prompt
      const apiMessages = [
        { role: 'system' as const, content: this.systemPrompt },
        ...this.messages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      await chatApi.streamChat(
        {
          provider: this.provider,
          model: this.model,
          messages: apiMessages,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        },
        (chunk) => {
          // Update last message with streamed content
          const lastIndex = this.messages.length - 1;
          this.messages = this.messages.map((m, i) =>
            i === lastIndex ? { ...m, content: m.content + chunk } : m
          );
          this.scrollToBottom();
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Update last message with error
      const lastIndex = this.messages.length - 1;
      this.messages = this.messages.map((m, i) =>
        i === lastIndex ? { ...m, content: `Error: ${message}` } : m
      );
    } finally {
      this.isStreaming = false;
      this.saveConversation();
    }
  }

  private clearConversation() {
    this.messages = [];
    storage.clearConversation();
    this.dispatchEvent(
      new CustomEvent('conversation-cleared', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private openSettings() {
    this.dispatchEvent(
      new CustomEvent('toggle-settings', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="header">
        <span class="title">Chat</span>
        <div class="actions">
          <button @click=${this.clearConversation}>Clear</button>
          <button @click=${this.openSettings}>Settings</button>
        </div>
      </div>

      <div class="messages">
        ${this.messages.length === 0
          ? html`<div class="empty">Start a conversation</div>`
          : repeat(
              this.messages,
              (m) => m.timestamp,
              (m) => html`
                <chat-message role=${m.role} content=${m.content}></chat-message>
              `
            )}
        ${this.isStreaming
          ? html`
              <div class="streaming-indicator">
                <span class="dot"></span>
                Generating response...
              </div>
            `
          : null}
      </div>

      <div class="input-area">
        <chat-input
          ?disabled=${this.isStreaming}
          @send-message=${this.handleSendMessage}
        ></chat-input>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-view': ChatView;
  }
}
