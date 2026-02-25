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

// Helper for Smart Address Display (Prioritizes Area/Sector)
export const getSmartAddress = (address?: string) => {
    if (!address || address === 'Unknown' || address === 'Unknown Address') return '';

    const parts = address.split(',').map(p => p.trim());

    // Tier 1: Priority Hubs & Landmarks (Cyber Hub, Malls, Business Centers)
    const hubRegex = /(Cyber\s?Hub|Cyber\s?City|Worldmark|Aerocity|Galleria|Horizon\s?Center|Vatika|Select\s?City|Promenade|Ambience|Mall|Market|Bazaar|Plaza|High\s?Street|Trade\s?Tower)/i;
    const hubPart = parts.find(p => hubRegex.test(p));
    if (hubPart) return `, ${hubPart}`;

    // Tier 2: Sectors & Phases
    const sectorRegex = /(Sector\s?\d+|Phase\s?\d+|Block\s?[A-Z](\s|$)|Pocket\s?[A-Z])/i;
    const sectorPart = parts.find(p => sectorRegex.test(p));
    if (sectorPart) return `, ${sectorPart}`;

    // Tier 3: Clean Fallback (Skip generic building terms)
    // We want the first part that ISN'T a building, floor, or unit number.
    const skipTerms = /^(Tower|Floor|Ground|Shop|Unit|Plot|Building|Room|Flat|No\.|#|Level)/i;

    // Find first valid part
    const bestPart = parts.find(p => !skipTerms.test(p) && p.length > 3 && isNaN(Number(p))); // Also skip purely numeric parts "12"

    if (bestPart) return `, ${bestPart}`;

    // Ultimate fallback: Just the 2nd part if 1st was bad, or just 1st.
    return `, ${parts[0]}`;
};
