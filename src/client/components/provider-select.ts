import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { modelsApi, providersApi, type ProviderInfo } from '../services/api.js';

type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

@customElement('provider-select')
export class ProviderSelect extends LitElement {
  @property() provider: ProviderName = 'ollama';
  @property() model: string = '';

  @state() private providers: ProviderInfo[] = [];
  @state() private ollamaModels: string[] = [];
  @state() private loadingModels = false;
  @state() private loadingProviders = true;
  @state() private modelError: string | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .field {
      margin-bottom: var(--space-md);
    }

    label {
      display: block;
      font-size: 0.875rem;
      margin-bottom: var(--space-xs);
      color: var(--color-fg);
    }

    select,
    input {
      width: 100%;
      padding: var(--space-sm);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      background: var(--color-bg);
      color: var(--color-fg);
      font-family: inherit;
      font-size: inherit;
      box-sizing: border-box;
    }

    select:focus,
    input:focus {
      outline: 2px solid var(--color-fg);
      outline-offset: 1px;
    }

    .docs-link {
      display: inline-block;
      margin-top: var(--space-xs);
      font-size: 0.75rem;
      color: var(--color-muted);
    }

    .docs-link:hover {
      color: var(--color-fg);
    }

    .error {
      color: #c00;
      font-size: 0.75rem;
      margin-top: var(--space-xs);
    }

    .loading {
      color: var(--color-muted);
      font-size: 0.75rem;
      margin-top: var(--space-xs);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadProviders();
  }

  private async loadProviders() {
    try {
      const { providers } = await providersApi.getProviders();
      this.providers = providers;

      // If current provider is not in enabled list, switch to first enabled
      const enabledNames = providers.map(p => p.name);
      if (!enabledNames.includes(this.provider) && providers.length > 0) {
        this.provider = providers[0].name as ProviderName;
        this.dispatchEvent(
          new CustomEvent('provider-changed', {
            detail: { provider: this.provider },
            bubbles: true,
            composed: true,
          })
        );
      }

      if (this.provider === 'ollama') {
        this.loadOllamaModels();
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      this.loadingProviders = false;
    }
  }

  private async loadOllamaModels() {
    this.loadingModels = true;
    this.modelError = null;

    try {
      const result = await modelsApi.getModels('ollama');
      if (result.supported && result.models) {
        this.ollamaModels = result.models;
        if (result.error) {
          this.modelError = result.error;
        }
      }
    } catch (error) {
      this.modelError = error instanceof Error ? error.message : 'Failed to load models';
    } finally {
      this.loadingModels = false;
    }
  }

  private getEnabledProviders(): ProviderName[] {
    return this.providers.map(p => p.name as ProviderName);
  }

  private handleProviderChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const newProvider = select.value as ProviderName;

    this.dispatchEvent(
      new CustomEvent('provider-changed', {
        detail: { provider: newProvider },
        bubbles: true,
        composed: true,
      })
    );

    if (newProvider === 'ollama') {
      this.loadOllamaModels();
    }
  }

  private handleModelChange(e: Event) {
    const target = e.target as HTMLSelectElement | HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('model-changed', {
        detail: { model: target.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getDocsUrl(): string | null {
    const provider = this.providers.find(p => p.name === this.provider);
    return provider?.docsUrl || null;
  }

  render() {
    if (this.loadingProviders) {
      return html`<div class="loading">Loading providers...</div>`;
    }

    const providers = this.getEnabledProviders();
    const docsUrl = this.getDocsUrl();
    const isOllama = this.provider === 'ollama';

    if (providers.length === 0) {
      return html`<div class="error">No providers available. Check your API keys in .env</div>`;
    }

    return html`
      <div class="field">
        <label for="provider">Provider</label>
        <select id="provider" @change=${this.handleProviderChange}>
          ${providers.map(
            (p) => html`
              <option value=${p} ?selected=${p === this.provider}>
                ${p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            `
          )}
        </select>
      </div>

      <div class="field">
        <label for="model">Model</label>
        ${isOllama
          ? html`
              <select id="model" @change=${this.handleModelChange}>
                ${this.ollamaModels.map(
                  (m) => html`
                    <option value=${m} ?selected=${m === this.model}>${m}</option>
                  `
                )}
                ${this.ollamaModels.length === 0 && !this.loadingModels
                  ? html`<option value="">No models found</option>`
                  : null}
              </select>
              ${this.loadingModels
                ? html`<div class="loading">Loading models...</div>`
                : null}
              ${this.modelError
                ? html`<div class="error">${this.modelError}</div>`
                : null}
            `
          : html`
              <input
                id="model"
                type="text"
                .value=${this.model}
                @change=${this.handleModelChange}
                placeholder="Enter model ID"
              />
            `}
        ${docsUrl
          ? html`
              <a class="docs-link" href=${docsUrl} target="_blank" rel="noopener">
                View available models
              </a>
            `
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'provider-select': ProviderSelect;
  }
}
