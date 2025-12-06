import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('param-controls')
export class ParamControls extends LitElement {
  @property({ type: Number }) temperature = 0.7;
  @property({ type: Number }) maxTokens = 2048;

  static styles = css`
    :host {
      display: block;
    }

    .field {
      margin-bottom: var(--space-md);
    }

    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      margin-bottom: var(--space-xs);
      color: var(--color-fg);
    }

    .value {
      font-family: monospace;
      color: var(--color-muted);
    }

    input[type='range'] {
      width: 100%;
      margin: 0;
      cursor: pointer;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-top: var(--space-xs);
    }
  `;

  private handleTemperatureChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.dispatchEvent(
      new CustomEvent('temperature-changed', {
        detail: { temperature: value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleMaxTokensChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.dispatchEvent(
      new CustomEvent('max-tokens-changed', {
        detail: { maxTokens: value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="field">
        <label>
          Temperature
          <span class="value">${this.temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          .value=${String(this.temperature)}
          @input=${this.handleTemperatureChange}
        />
        <div class="range-labels">
          <span>0 (precise)</span>
          <span>2 (creative)</span>
        </div>
      </div>

      <div class="field">
        <label>
          Max Tokens
          <span class="value">${this.maxTokens}</span>
        </label>
        <input
          type="range"
          min="256"
          max="8192"
          step="256"
          .value=${String(this.maxTokens)}
          @input=${this.handleMaxTokensChange}
        />
        <div class="range-labels">
          <span>256</span>
          <span>8192</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'param-controls': ParamControls;
  }
}
