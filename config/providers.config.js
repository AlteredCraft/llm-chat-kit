export default {
  providers: {
    openai: {
      keyName: 'OPENAI_API_KEY',
      docsUrl: 'https://platform.openai.com/docs/models'
    },
    anthropic: {
      keyName: 'ANTHROPIC_API_KEY',
      docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    google: {
      keyName: 'GOOGLE_GENERATIVE_AI_API_KEY',
      docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },
    ollama: {
      // No API key required - local server
      keyName: null,
      baseUrl: 'http://localhost:11434',
      docsUrl: 'https://ollama.com/library'
    }
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2048
  }
};
