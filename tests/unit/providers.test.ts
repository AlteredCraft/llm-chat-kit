import { describe, it, expect } from 'bun:test';
import { isProviderEnabled, getProviderConfig, getDefaults, getModel, type ProviderName } from '../../src/server/lib/providers';

describe('Providers', () => {
  describe('isProviderEnabled', () => {
    it('should return boolean for valid providers', () => {
      const providers: ProviderName[] = ['openai', 'anthropic', 'google', 'ollama'];

      for (const provider of providers) {
        const result = isProviderEnabled(provider);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should return true for ollama (default enabled)', () => {
      expect(isProviderEnabled('ollama')).toBe(true);
    });
  });

  describe('getProviderConfig', () => {
    it('should return config object for valid providers', () => {
      const config = getProviderConfig('ollama');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('keyName');
    });

    it('should include baseUrl for ollama', () => {
      const config = getProviderConfig('ollama');
      expect(config?.baseUrl).toBeDefined();
      expect(config?.baseUrl).toContain('localhost:11434');
    });

    it('should include docsUrl for providers', () => {
      const providers: ProviderName[] = ['openai', 'anthropic', 'google', 'ollama'];

      for (const provider of providers) {
        const config = getProviderConfig(provider);
        expect(config?.docsUrl).toBeDefined();
        expect(typeof config?.docsUrl).toBe('string');
      }
    });
  });

  describe('getModel', () => {
    it('should throw error for unknown provider', () => {
      expect(() => getModel('unknown' as ProviderName, 'model-id')).toThrow('Unknown provider: unknown');
    });

    it('should return a model instance for valid providers', () => {
      // Test that getModel returns something for each valid provider
      // We can't fully test the model without hitting the API, but we can verify no errors
      const providers: ProviderName[] = ['openai', 'anthropic', 'google', 'ollama'];

      for (const provider of providers) {
        const model = getModel(provider, 'test-model');
        expect(model).toBeDefined();
      }
    });
  });

  describe('getDefaults', () => {
    it('should return default configuration', () => {
      const defaults = getDefaults();
      expect(defaults).toBeDefined();
    });

    it('should have required default fields', () => {
      const defaults = getDefaults();
      expect(defaults).toHaveProperty('temperature');
      expect(defaults).toHaveProperty('maxTokens');
    });

    it('should have valid temperature range', () => {
      const defaults = getDefaults();
      expect(defaults.temperature).toBeGreaterThanOrEqual(0);
      expect(defaults.temperature).toBeLessThanOrEqual(2);
    });

    it('should have positive maxTokens', () => {
      const defaults = getDefaults();
      expect(defaults.maxTokens).toBeGreaterThan(0);
    });
  });
});
