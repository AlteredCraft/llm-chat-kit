import { Hono } from 'hono';
import { getProviderConfig, isProviderEnabled, type ProviderName } from '../lib/providers';

export const modelsRoute = new Hono();

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

// Get available models for a provider
modelsRoute.get('/:provider', async (c) => {
  const provider = c.req.param('provider') as ProviderName;

  if (!isProviderEnabled(provider)) {
    return c.json({ error: `Provider "${provider}" is not enabled` }, 400);
  }

  const config = getProviderConfig(provider);

  // For Ollama, fetch models dynamically
  if (provider === 'ollama') {
    try {
      const baseUrl = config?.baseUrl || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama not reachable at ${baseUrl}`);
      }

      const data = await response.json() as OllamaTagsResponse;
      const models = data.models.map((m) => m.name);

      return c.json({
        supported: true,
        models,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({
        supported: true,
        models: [],
        error: message,
      });
    }
  }

  // For other providers, return unsupported with docs link
  return c.json({
    supported: false,
    docsUrl: config?.docsUrl || null,
  });
});
