import React, { useState, useEffect } from 'react';
import { modelsApi, providersApi, type ProviderInfo } from '../services/api';
import './ProviderSelect.css';

type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

interface ProviderSelectProps {
    provider: ProviderName;
    model: string;
    onProviderChange: (provider: ProviderName) => void;
    onModelChange: (model: string) => void;
}

export function ProviderSelect({
    provider,
    model,
    onProviderChange,
    onModelChange,
}: ProviderSelectProps) {
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [modelError, setModelError] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    useEffect(() => {
        if (provider === 'ollama') {
            loadOllamaModels();
        }
    }, [provider]);

    async function loadProviders() {
        try {
            const { providers: loadedProviders } = await providersApi.getProviders();
            setProviders(loadedProviders);

            // If current provider is not in enabled list, switch to first enabled
            const enabledNames = loadedProviders.map((p) => p.name);
            if (!enabledNames.includes(provider) && loadedProviders.length > 0) {
                onProviderChange(loadedProviders[0].name as ProviderName);
            }
        } catch (error) {
            console.error('Failed to load providers:', error);
        } finally {
            setLoadingProviders(false);
        }
    }

    async function loadOllamaModels() {
        setLoadingModels(true);
        setModelError(null);

        try {
            const result = await modelsApi.getModels('ollama');
            if (result.supported && result.models) {
                setOllamaModels(result.models);
                if (result.error) {
                    setModelError(result.error);
                }
            }
        } catch (error) {
            setModelError(error instanceof Error ? error.message : 'Failed to load models');
        } finally {
            setLoadingModels(false);
        }
    }

    function getDocsUrl(): string | null {
        const p = providers.find((p) => p.name === provider);
        return p?.docsUrl || null;
    }

    if (loadingProviders) {
        return <div className="provider-select__loading">Loading providers...</div>;
    }

    const enabledProviders = providers.map((p) => p.name as ProviderName);
    const docsUrl = getDocsUrl();
    const isOllama = provider === 'ollama';

    if (enabledProviders.length === 0) {
        return (
            <div className="provider-select__error">
                No providers available. Check your API keys in .env
            </div>
        );
    }

    return (
        <div className="provider-select">
            <div className="provider-select__field">
                <label htmlFor="provider">Provider</label>
                <select
                    id="provider"
                    value={provider}
                    onChange={(e) => onProviderChange(e.target.value as ProviderName)}
                >
                    {enabledProviders.map((p) => (
                        <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="provider-select__field">
                <label htmlFor="model">Model</label>
                {isOllama ? (
                    <>
                        <select
                            id="model"
                            value={model}
                            onChange={(e) => onModelChange(e.target.value)}
                        >
                            {ollamaModels.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                            {ollamaModels.length === 0 && !loadingModels && (
                                <option value="">No models found</option>
                            )}
                        </select>
                        {loadingModels && (
                            <div className="provider-select__loading">Loading models...</div>
                        )}
                        {modelError && (
                            <div className="provider-select__error">{modelError}</div>
                        )}
                    </>
                ) : (
                    <input
                        id="model"
                        type="text"
                        value={model}
                        onChange={(e) => onModelChange(e.target.value)}
                        placeholder="Enter model ID"
                    />
                )}
                {docsUrl && (
                    <a
                        className="provider-select__docs-link"
                        href={docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View available models
                    </a>
                )}
            </div>
        </div>
    );
}
