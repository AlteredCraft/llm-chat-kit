import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './chat-view.js';
import './settings-panel.js';
import { storage, type Settings } from '../services/storage.js';
import { promptsApi, providersApi, type Prompt } from '../services/api.js';

@customElement('chat-app')
export class ChatApp extends LitElement {
  @state() private settingsOpen = false;
  @state() private settings: Settings;
  @state() private prompts: Prompt[] = [];
  @state() private activePrompt: Prompt | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      background: var(--color-bg);
      color: var(--color-fg);
    }

    .layout {
      display: flex;
      height: 100%;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar {
      width: 320px;
      border-left: var(--border-width) solid var(--color-border);
      transform: translateX(100%);
      transition: transform 0.2s ease;
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      background: var(--color-bg);
      z-index: 100;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 99;
    }

    .overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }
  `;

  constructor() {
    super();
    // Initialize with saved settings or temporary defaults
    const saved = storage.getSettings();
    this.settings = saved || {
      provider: 'ollama',
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      activePromptId: 'default',
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadDefaults();
    this.loadPrompts();
    this.setupKeyboardShortcuts();
  }

  private async loadDefaults() {
    try {
      const { defaults } = await providersApi.getProviders();
      // Only apply defaults if no saved settings or if saved provider is no longer enabled
      const saved = storage.getSettings();
      if (!saved || !defaults.provider) {
        this.settings = {
          ...this.settings,
          provider: defaults.provider || 'ollama',
          temperature: defaults.temperature,
          maxTokens: defaults.maxTokens,
        };
      }
    } catch (error) {
      console.error('Failed to load defaults:', error);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeKeyboardShortcuts();
  }

  private keyHandler = (e: KeyboardEvent) => {
    // Ctrl/Cmd + , to toggle settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      this.toggleSettings();
    }
    // Escape to close settings
    if (e.key === 'Escape' && this.settingsOpen) {
      this.settingsOpen = false;
    }
  };

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.keyHandler);
  }

  private removeKeyboardShortcuts() {
    document.removeEventListener('keydown', this.keyHandler);
  }

  private async loadPrompts() {
    try {
      const result = await promptsApi.getAll();
      this.prompts = result.prompts;
      this.activePrompt =
        this.prompts.find((p) => p.id === this.settings.activePromptId) ||
        this.prompts.find((p) => p.isDefault) ||
        this.prompts[0] ||
        null;
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  }

  private toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
  }

  private handleToggleSettings() {
    this.toggleSettings();
  }

  private handleSettingsChanged(
    e: CustomEvent<Partial<Settings>>
  ) {
    this.settings = { ...this.settings, ...e.detail };
    storage.saveSettings(this.settings);
  }

  private handlePromptSelected(e: CustomEvent<{ promptId: string }>) {
    const prompt = this.prompts.find((p) => p.id === e.detail.promptId);
    if (prompt) {
      this.activePrompt = prompt;
      this.settings = { ...this.settings, activePromptId: prompt.id };
      storage.saveSettings(this.settings);
    }
  }

  private async handlePromptCreated(e: CustomEvent<{ prompt: Prompt }>) {
    this.prompts = [...this.prompts, e.detail.prompt];
  }

  private async handlePromptUpdated(e: CustomEvent<{ prompt: Prompt }>) {
    this.prompts = this.prompts.map((p) =>
      p.id === e.detail.prompt.id ? e.detail.prompt : p
    );
    if (this.activePrompt?.id === e.detail.prompt.id) {
      this.activePrompt = e.detail.prompt;
    }
  }

  private async handlePromptDeleted(e: CustomEvent<{ promptId: string }>) {
    this.prompts = this.prompts.filter((p) => p.id !== e.detail.promptId);
    if (this.activePrompt?.id === e.detail.promptId) {
      this.activePrompt = this.prompts.find((p) => p.isDefault) || this.prompts[0] || null;
      if (this.activePrompt) {
        this.settings = { ...this.settings, activePromptId: this.activePrompt.id };
        storage.saveSettings(this.settings);
      }
    }
  }

  render() {
    return html`
      <div class="layout">
        <div class="main">
          <chat-view
            provider=${this.settings.provider}
            model=${this.settings.model}
            temperature=${this.settings.temperature}
            maxTokens=${this.settings.maxTokens}
            systemPrompt=${this.activePrompt?.prompt || 'You are a helpful assistant.'}
            @toggle-settings=${this.handleToggleSettings}
          ></chat-view>
        </div>

        <div
          class="overlay ${this.settingsOpen ? 'visible' : ''}"
          @click=${() => (this.settingsOpen = false)}
        ></div>

        <div class="sidebar ${this.settingsOpen ? 'open' : ''}">
          <settings-panel
            .settings=${this.settings}
            .prompts=${this.prompts}
            .activePromptId=${this.activePrompt?.id || ''}
            @close=${() => (this.settingsOpen = false)}
            @settings-changed=${this.handleSettingsChanged}
            @prompt-selected=${this.handlePromptSelected}
            @prompt-created=${this.handlePromptCreated}
            @prompt-updated=${this.handlePromptUpdated}
            @prompt-deleted=${this.handlePromptDeleted}
          ></settings-panel>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-app': ChatApp;
  }
}
