import React from 'react';
import './ParamControls.css';

interface ParamControlsProps {
    temperature: number;
    maxTokens: number;
    onTemperatureChange: (temperature: number) => void;
    onMaxTokensChange: (maxTokens: number) => void;
}

export function ParamControls({
    temperature,
    maxTokens,
    onTemperatureChange,
    onMaxTokensChange,
}: ParamControlsProps) {
    return (
        <div className="param-controls">
            <div className="param-controls__field">
                <label>
                    Temperature
                    <span className="param-controls__value">{temperature.toFixed(1)}</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                />
                <div className="param-controls__range-labels">
                    <span>0 (precise)</span>
                    <span>2 (creative)</span>
                </div>
            </div>

            <div className="param-controls__field">
                <label>
                    Max Tokens
                    <span className="param-controls__value">{maxTokens}</span>
                </label>
                <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => onMaxTokensChange(parseInt(e.target.value, 10))}
                />
                <div className="param-controls__range-labels">
                    <span>256</span>
                    <span>8192</span>
                </div>
            </div>
        </div>
    );
}
