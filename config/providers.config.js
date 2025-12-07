export default {
  providers: {
    openai: {
      keyName: 'OPENAI_API_KEY',
      docsUrl: 'https://platform.openai.com/docs/models',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    anthropic: {
      keyName: 'ANTHROPIC_API_KEY',
      docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
    },
    google: {
      keyName: 'GOOGLE_GENERATIVE_AI_API_KEY',
      docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
      models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
    },
    ollama: {
      // No API key required - local server
      keyName: null,
      baseUrl: 'http://localhost:11434',
      docsUrl: 'https://ollama.com/library'
      // models fetched dynamically from Ollama API
    }
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2048
  }
};

