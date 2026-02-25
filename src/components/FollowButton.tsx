import React from 'react';
import { Plus, Minus, Check, UserCheck } from 'lucide-react';

interface FollowButtonProps {
    isFollowing: boolean;
    isFollower?: boolean; // They follow me
    isFriend?: boolean;   // Mutual follow
    onToggle: (e: React.MouseEvent) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
    isFollowing,
    isFollower = false,
    isFriend = false,
    onToggle,
    size = 'md',
    className = ''
}) => {
    // Size mapping (scaled to ~65%)
    const sizeClasses = {
        sm: 'w-3.5 h-3.5 p-0.5',
        md: 'w-4 h-4 p-0.5',
        lg: 'w-5 h-5 p-1'
    };

    const iconSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3'
    };

    // Determine State Config
    let label = "Follow";
    let Icon = Plus;
    let baseStyles = "bg-brand-600 border-brand-500 text-white hover:bg-brand-500 hover:scale-105 shadow-brand-500/20";

    if (isFriend) {
        label = "Friend";
        Icon = UserCheck;
        baseStyles = "bg-slate-800 border-slate-600 text-brand-300 hover:text-white hover:border-brand-500 hover:bg-brand-900/50";
    } else if (isFollowing) {
        label = "Following";
        Icon = Check;
        baseStyles = "bg-slate-800 border-slate-600 text-slate-400 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500";
    } else if (isFollower) {
        label = "Follow Back";
        Icon = Plus;
        baseStyles = "bg-brand-600 border-brand-500 text-white hover:bg-brand-500 hover:scale-105 shadow-brand-500/20";
    }

    // Size Classes injection
    const layoutClasses = `
        ${size === 'sm' ? 'px-3 py-1 text-[10px]' : ''}
        ${size === 'md' ? 'px-4 py-1.5 text-[11px]' : ''}
        ${size === 'lg' ? 'px-6 py-2 text-sm' : ''}
    `;

    return (
        <button
            onClick={onToggle}
            className={`
                rounded-xl flex items-center justify-center transition-all shadow-lg border font-bold gap-1.5
                ${baseStyles}
                ${layoutClasses}
                ${className}
            `}
            title={isFollowing ? "Unfollow" : "Follow"}
        >
            <Icon className={iconSizes[size]} />
            <span>{label}</span>
        </button>
    );
};
