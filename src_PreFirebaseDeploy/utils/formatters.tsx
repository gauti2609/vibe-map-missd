import React from 'react';

// Helper for Date Formatting (dd/mm/yyyy)
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

// Helper for Time Formatting (24h)
export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to render text with @mentions and #hashtags
export const renderTextWithTags = (text: string) => {
    return text.split(/(\s+)/).map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="text-blue-400 font-medium cursor-pointer hover:underline">{part}</span>;
        }
        if (part.startsWith('#')) {
            return <span key={i} className="text-brand-400 font-medium cursor-pointer hover:underline">{part}</span>;
        }
        return part;
    });
};
