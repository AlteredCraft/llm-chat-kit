import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
// @ts-ignore
import config from '../../../config/providers.config.js';

export type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

// Create Ollama provider instance with base URL from config
// The ollama provider expects baseURL to include /api path for chat endpoints
const ollamaConfig = config.providers.ollama;
const ollamaBaseUrl = ollamaConfig?.baseUrl || 'http://localhost:11434';
const ollama = createOllama({
  baseURL: `${ollamaBaseUrl}/api`,
});

export function getModel(provider: ProviderName, modelId: string) {
  switch (provider) {
    case 'openai':
      return openai(modelId);
    case 'anthropic':
      return anthropic(modelId);
    case 'google':
      return google(modelId);
    case 'ollama':
      return ollama(modelId);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function isProviderEnabled(provider: ProviderName, env: Record<string, string | undefined> = process.env): boolean {
  const providerConfig = config.providers[provider];
  if (!providerConfig) return false;

  // Ollama has no keyName (null) - always enabled
  if (providerConfig.keyName === null) return true;

  // Other providers need their API key set
  return !!env[providerConfig.keyName];
}

export function getEnabledProviders(env: Record<string, string | undefined> = process.env): ProviderName[] {
  return (Object.keys(config.providers) as ProviderName[]).filter(p => isProviderEnabled(p, env));
}

export function getProviderConfig(provider: ProviderName) {
  return config.providers[provider];
}

export function getDefaults() {
  return config.defaults;
}
