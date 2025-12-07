import React from 'react';
import './ChatMessage.css';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    model?: string;
}

export function ChatMessage({ role, content, model }: ChatMessageProps) {
    return (
        <div className="chat-message">
            <div className="chat-message__role">
                {role}
                {role === 'assistant' && model && (
                    <span className="chat-message__model"> [{model}]</span>
                )}
            </div>
            <div className={`chat-message__content chat-message__content--${role}`}>
                {content}
            </div>
        </div>
    );
}
