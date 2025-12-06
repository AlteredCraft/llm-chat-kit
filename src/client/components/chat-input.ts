import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('chat-input')
export class ChatInput extends LitElement {
  @property({ type: Boolean }) disabled = false;
  @query('textarea') textarea!: HTMLTextAreaElement;

  static styles = css`
    :host {
      display: block;
    }

    .input-container {
      display: flex;
      gap: var(--space-sm);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-sm);
      background: var(--color-bg);
    }

    textarea {
      flex: 1;
      border: none;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: inherit;
      line-height: 1.5;
      min-height: 1.5em;
      max-height: 10em;
      background: transparent;
      color: var(--color-fg);
    }

    textarea::placeholder {
      color: var(--color-muted);
    }

    button {
      padding: var(--space-sm) var(--space-md);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg);
      color: var(--color-fg);
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      transition: background 0.15s;
    }

    button:hover:not(:disabled) {
      background: var(--color-user-bg);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .hint {
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-top: var(--space-xs);
    }
  `;

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.submit();
    }
  }

  private handleInput() {
    // Auto-resize textarea
    const textarea = this.textarea;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  private submit() {
    const value = this.textarea.value.trim();
    if (value && !this.disabled) {
      this.dispatchEvent(
        new CustomEvent('send-message', {
          detail: { content: value },
          bubbles: true,
          composed: true,
        })
      );
      this.textarea.value = '';
      this.textarea.style.height = 'auto';
    }
  }

  render() {
    return html`
      <div class="input-container">
        <textarea
          placeholder="Type a message..."
          ?disabled=${this.disabled}
          @keydown=${this.handleKeyDown}
          @input=${this.handleInput}
          rows="1"
        ></textarea>
        <button ?disabled=${this.disabled} @click=${this.submit}>
          Send
        </button>
      </div>
      <div class="hint">Press Enter to send, Shift+Enter for new line</div>
    `;
  }

  focus() {
    this.textarea?.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-input': ChatInput;
  }
}
