import { existsSync } from 'fs';
import { resolve } from 'path';
import config from '../../../config/providers.config.js';

export interface StartupCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export interface StartupResult {
  canStart: boolean;
  checks: StartupCheck[];
}

type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

/**
 * Optional dependencies - inject these for unit testing.
 * Default behavior uses real filesystem and process.env.
 */
interface StartupDeps {
  env?: Record<string, string | undefined>;
  cwd?: string;
  fileExists?: (path: string) => boolean;
}

/**
 * Check if a provider is enabled based on its API key in env vars.
 * Ollama (keyName: null) is always enabled since it's local.
 */
function isProviderEnabled(provider: ProviderName, env: Record<string, string | undefined>): boolean {
  const providerConfig = config.providers[provider];
  if (!providerConfig) return false;
  if (providerConfig.keyName === null) return true;
  return !!env[providerConfig.keyName];
}

export function runStartupChecks(deps: StartupDeps = {}): StartupResult {
  const env = deps.env ?? process.env;
  const cwd = deps.cwd ?? process.cwd();
  const fileExists = deps.fileExists ?? existsSync;

  const checks: StartupCheck[] = [];
  let canStart = true;

  // Check 1: .env file exists
  const envPath = resolve(cwd, '.env');
  if (!fileExists(envPath)) {
    checks.push({
      name: '.env file',
      status: 'error',
      message: 'Missing .env file. Run: cp .env.example .env',
    });
    canStart = false;
  } else {
    checks.push({
      name: '.env file',
      status: 'ok',
      message: 'Found',
    });
  }

  // Check 2: Show provider status based on API keys
  const providerChecks = checkProviders(env);
  checks.push(...providerChecks);

  // Check 3: At least one provider is enabled
  const enabledProviders = (Object.keys(config.providers) as ProviderName[])
    .filter(name => isProviderEnabled(name, env));

  if (enabledProviders.length === 0) {
    checks.push({
      name: 'Providers',
      status: 'error',
      message: 'No providers enabled. Add API keys to .env or ensure Ollama is configured.',
    });
    canStart = false;
  } else {
    checks.push({
      name: 'Providers',
      status: 'ok',
      message: `Enabled: ${enabledProviders.join(', ')}`,
    });
  }

  // Check 4: Client build exists
  const clientPath = resolve(cwd, 'dist/client/index.html');
  if (!fileExists(clientPath)) {
    checks.push({
      name: 'Client build',
      status: 'warn',
      message: 'Client not built. Run: bun run build:client',
    });
  } else {
    checks.push({
      name: 'Client build',
      status: 'ok',
      message: 'Found',
    });
  }

  return { canStart, checks };
}

export function checkProviders(env: Record<string, string | undefined> = process.env): StartupCheck[] {
  const checks: StartupCheck[] = [];

  for (const [name, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig) continue;

    // Ollama has no keyName - always show as available
    if (providerConfig.keyName === null) {
      const baseUrl = providerConfig.baseUrl || 'http://localhost:11434';
      checks.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        status: 'ok',
        message: `Available at ${baseUrl}`,
      });
    } else if (env[providerConfig.keyName]) {
      checks.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        status: 'ok',
        message: 'API key configured',
      });
    }
    // Don't show providers without keys - they're simply not enabled
  }

  return checks;
}

export function printStartupReport(checks: StartupCheck[], canStart: boolean): void {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│       LLM Chat Kit - Startup Check      │');
  console.log('└─────────────────────────────────────────┘\n');

  for (const check of checks) {
    const icon = check.status === 'ok' ? '✓' : check.status === 'warn' ? '!' : '✗';
    const color = check.status === 'ok' ? '\x1b[32m' : check.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    console.log(`  ${color}${icon}${reset} ${check.name}: ${check.message}`);
  }

  console.log('');

  if (!canStart) {
    console.log('\x1b[31m✗ Cannot start server. Please fix the errors above.\x1b[0m\n');
  }
}
