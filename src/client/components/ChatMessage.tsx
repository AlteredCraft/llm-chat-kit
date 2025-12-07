import React from 'react';
import './ChatMessage.css';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
    return (
        <div className="chat-message">
            <div className="chat-message__role">{role}</div>
            <div className={`chat-message__content chat-message__content--${role}`}>
                {content}
            </div>
        </div>
    );
}
