declare module '../../../config/providers.config.js' {
  const config: {
    providers: {
      openai: {
        keyName: string;
        docsUrl: string;
        models: string[];
      };
      anthropic: {
        keyName: string;
        docsUrl: string;
        models: string[];
      };
      google: {
        keyName: string;
        docsUrl: string;
        models: string[];
      };
      ollama: {
        keyName: null;
        baseUrl: string;
        docsUrl: string;
      };
    };
    defaults: {
      temperature: number;
      maxTokens: number;
    };
  };
  export default config;
}