import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('chat-message')
export class ChatMessage extends LitElement {
  @property() role: 'user' | 'assistant' = 'user';
  @property() content: string = '';

  static styles = css`
    :host {
      display: block;
      margin: var(--space-sm) 0;
    }

    .message {
      padding: var(--space-sm) var(--space-md);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    }

    .user {
      background: var(--color-user-bg);
      margin-left: var(--space-lg);
    }

    .assistant {
      background: var(--color-assistant-bg);
      margin-right: var(--space-lg);
    }

    .role {
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-bottom: var(--space-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `;

  render() {
    return html`
      <div class="role">${this.role}</div>
      <div class="message ${this.role}">${this.content}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-message': ChatMessage;
  }
}
