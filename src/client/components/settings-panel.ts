import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './provider-select.js';
import './param-controls.js';
import './prompt-manager.js';
import type { Settings } from '../services/storage.js';
import type { Prompt } from '../services/api.js';

@customElement('settings-panel')
export class SettingsPanel extends LitElement {
  @property({ type: Object }) settings!: Settings;
  @property({ type: Array }) prompts: Prompt[] = [];
  @property() activePromptId: string = '';

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

    .close-btn {
      padding: var(--space-xs) var(--space-sm);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg);
      color: var(--color-fg);
      cursor: pointer;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1;
    }

    .close-btn:hover {
      background: var(--color-user-bg);
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-md);
    }

    .section {
      margin-bottom: var(--space-lg);
    }

    .section-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: var(--space-sm);
      padding-bottom: var(--space-xs);
      border-bottom: var(--border-width) solid var(--color-border);
    }
  `;

  private handleClose() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private handleProviderChanged(e: CustomEvent<{ provider: string }>) {
    this.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: { provider: e.detail.provider },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleModelChanged(e: CustomEvent<{ model: string }>) {
    this.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: { model: e.detail.model },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleTemperatureChanged(e: CustomEvent<{ temperature: number }>) {
    this.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: { temperature: e.detail.temperature },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleMaxTokensChanged(e: CustomEvent<{ maxTokens: number }>) {
    this.dispatchEvent(
      new CustomEvent('settings-changed', {
        detail: { maxTokens: e.detail.maxTokens },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="header">
        <span class="title">Settings</span>
        <button class="close-btn" @click=${this.handleClose}>x</button>
      </div>

      <div class="content">
        <div class="section">
          <div class="section-title">Provider</div>
          <provider-select
            provider=${this.settings?.provider || 'ollama'}
            model=${this.settings?.model || ''}
            @provider-changed=${this.handleProviderChanged}
            @model-changed=${this.handleModelChanged}
          ></provider-select>
        </div>

        <div class="section">
          <div class="section-title">Parameters</div>
          <param-controls
            temperature=${this.settings?.temperature || 0.7}
            maxTokens=${this.settings?.maxTokens || 2048}
            @temperature-changed=${this.handleTemperatureChanged}
            @max-tokens-changed=${this.handleMaxTokensChanged}
          ></param-controls>
        </div>

        <div class="section">
          <div class="section-title">System Prompt</div>
          <prompt-manager
            .prompts=${this.prompts}
            activePromptId=${this.activePromptId}
          ></prompt-manager>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'settings-panel': SettingsPanel;
  }
}
