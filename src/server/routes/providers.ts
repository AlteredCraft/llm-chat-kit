import { Hono } from 'hono';
import { getEnabledProviders, getProviderConfig, getDefaults, type ProviderName } from '../lib/providers';

export const providersRoute = new Hono();

// Get enabled providers and their config (for client initialization)
providersRoute.get('/', (c) => {
  const enabledProviders = getEnabledProviders();
  const defaults = getDefaults();

  // Build provider info for client
  const providers = enabledProviders.map(name => ({
    name,
    docsUrl: getProviderConfig(name)?.docsUrl,
  }));

  // Default to first enabled provider
  const defaultProvider = enabledProviders[0] || null;

  return c.json({
    providers,
    defaults: {
      provider: defaultProvider,
      temperature: defaults.temperature,
      maxTokens: defaults.maxTokens,
    },
  });
});
