import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { promptsApi, type Prompt } from '../services/api.js';

@customElement('prompt-manager')
export class PromptManager extends LitElement {
  @property({ type: Array }) prompts: Prompt[] = [];
  @property() activePromptId: string = '';

  @state() private isCreating = false;
  @state() private editingId: string | null = null;
  @state() private newName = '';
  @state() private newPrompt = '';

  static styles = css`
    :host {
      display: block;
    }

    .prompt-list {
      margin-bottom: var(--space-md);
    }

    .prompt-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      margin-bottom: var(--space-xs);
      cursor: pointer;
    }

    .prompt-item:hover {
      background: var(--color-user-bg);
    }

    .prompt-item.active {
      border-color: var(--color-fg);
    }

    .prompt-item input[type='radio'] {
      margin: 0;
    }

    .prompt-info {
      flex: 1;
      min-width: 0;
    }

    .prompt-name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .prompt-badge {
      font-size: 0.625rem;
      padding: 1px 4px;
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      color: var(--color-muted);
    }

    .prompt-actions {
      display: flex;
      gap: var(--space-xs);
    }

    .icon-btn {
      padding: var(--space-xs);
      border: var(--border-width) solid transparent;
      border-radius: var(--border-radius);
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
      font-size: 0.875rem;
      line-height: 1;
    }

    .icon-btn:hover {
      border-color: var(--color-border);
      color: var(--color-fg);
    }

    button {
      padding: var(--space-sm) var(--space-md);
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

    .form {
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--border-radius);
      padding: var(--space-md);
      margin-bottom: var(--space-md);
    }

    .form-field {
      margin-bottom: var(--space-sm);
    }

    .form-field label {
      display: block;
      font-size: 0.875rem;
      margin-bottom: var(--space-xs);
    }

    .form-field input,
    .form-field textarea {
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

    .form-field textarea {
      min-height: 80px;
      resize: vertical;
    }

    .form-actions {
      display: flex;
      gap: var(--space-sm);
      justify-content: flex-end;
    }

    .cancel-btn {
      background: transparent;
    }
  `;

  private handleSelect(promptId: string) {
    this.dispatchEvent(
      new CustomEvent('prompt-selected', {
        detail: { promptId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private startCreate() {
    this.isCreating = true;
    this.newName = '';
    this.newPrompt = '';
  }

  private cancelCreate() {
    this.isCreating = false;
    this.newName = '';
    this.newPrompt = '';
  }

  private async submitCreate() {
    if (!this.newName.trim() || !this.newPrompt.trim()) return;

    try {
      const result = await promptsApi.create(this.newName.trim(), this.newPrompt.trim());
      this.dispatchEvent(
        new CustomEvent('prompt-created', {
          detail: { prompt: result.prompt },
          bubbles: true,
          composed: true,
        })
      );
      this.cancelCreate();
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  }

  private startEdit(prompt: Prompt) {
    this.editingId = prompt.id;
    this.newName = prompt.name;
    this.newPrompt = prompt.prompt;
  }

  private cancelEdit() {
    this.editingId = null;
    this.newName = '';
    this.newPrompt = '';
  }

  private async submitEdit() {
    if (!this.editingId || !this.newName.trim() || !this.newPrompt.trim()) return;

    try {
      const result = await promptsApi.update(
        this.editingId,
        this.newName.trim(),
        this.newPrompt.trim()
      );
      this.dispatchEvent(
        new CustomEvent('prompt-updated', {
          detail: { prompt: result.prompt },
          bubbles: true,
          composed: true,
        })
      );
      this.cancelEdit();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  }

  private async deletePrompt(promptId: string) {
    if (!confirm('Delete this prompt?')) return;

    try {
      await promptsApi.delete(promptId);
      this.dispatchEvent(
        new CustomEvent('prompt-deleted', {
          detail: { promptId },
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  }

  private isUserPrompt(prompt: Prompt): boolean {
    return prompt.id.startsWith('user-');
  }

  private renderForm(isEdit: boolean) {
    return html`
      <div class="form">
        <div class="form-field">
          <label>Name</label>
          <input
            type="text"
            .value=${this.newName}
            @input=${(e: Event) => (this.newName = (e.target as HTMLInputElement).value)}
            placeholder="Prompt name"
          />
        </div>
        <div class="form-field">
          <label>System Prompt</label>
          <textarea
            .value=${this.newPrompt}
            @input=${(e: Event) => (this.newPrompt = (e.target as HTMLTextAreaElement).value)}
            placeholder="You are a helpful assistant..."
          ></textarea>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click=${isEdit ? this.cancelEdit : this.cancelCreate}>
            Cancel
          </button>
          <button @click=${isEdit ? this.submitEdit : this.submitCreate}>
            ${isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="prompt-list">
        ${this.prompts.map((prompt) =>
          this.editingId === prompt.id
            ? this.renderForm(true)
            : html`
                <div
                  class="prompt-item ${prompt.id === this.activePromptId ? 'active' : ''}"
                  @click=${() => this.handleSelect(prompt.id)}
                >
                  <input
                    type="radio"
                    name="prompt"
                    ?checked=${prompt.id === this.activePromptId}
                  />
                  <div class="prompt-info">
                    <div class="prompt-name">${prompt.name}</div>
                  </div>
                  ${prompt.isDefault
                    ? html`<span class="prompt-badge">default</span>`
                    : null}
                  ${this.isUserPrompt(prompt)
                    ? html`
                        <div class="prompt-actions">
                          <button
                            class="icon-btn"
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              this.startEdit(prompt);
                            }}
                            title="Edit"
                          >
                            e
                          </button>
                          <button
                            class="icon-btn"
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              this.deletePrompt(prompt.id);
                            }}
                            title="Delete"
                          >
                            x
                          </button>
                        </div>
                      `
                    : null}
                </div>
              `
        )}
      </div>

      ${this.isCreating
        ? this.renderForm(false)
        : html`<button @click=${this.startCreate}>+ New Prompt</button>`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'prompt-manager': PromptManager;
  }
}
