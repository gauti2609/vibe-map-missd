import React from 'react';
import { Notification } from '../types'; // Adjust path as needed
import { X, Check, Heart, MessageCircle, UserPlus, Calendar, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAllRead: () => void;
    onNotificationClick: (n: Notification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
    isOpen,
    onClose,
    notifications,
    onMarkAllRead,
    onNotificationClick
}) => {
    if (!isOpen) return null;

    const handleUndo = (targetId: string) => {
        const [action, postId, commentId] = targetId.split(':');
        if (action === 'undo-comment-delete' && postId && commentId) {
            const url = new URL(window.location.href);
            url.searchParams.set('undo', targetId);
            window.history.pushState({}, '', url.toString());
            onClose();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'system': return <Bell className="w-4 h-4 text-slate-400" />;
            case 'like': return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-blue-400" />;
            case 'follow': return <UserPlus className="w-4 h-4 text-green-400" />;
            case 'rsvp': return <Calendar className="w-4 h-4 text-amber-400" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="absolute top-16 right-4 md:right-8 w-80 md:w-96 bg-brand-900 border border-brand-800 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-brand-800 flex justify-between items-center bg-brand-900/95 backdrop-blur sticky top-0 z-10">
                <h3 className="font-bold text-white flex items-center gap-2">
                    Notifications
                    {notifications.some(n => !n.read) && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {notifications.filter(n => !n.read).length} new
                        </span>
                    )}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={onMarkAllRead}
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-white/5 rounded-lg transition"
                        title="Mark all read"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-brand-700">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                        <Bell className="w-8 h-8 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => {
                                if (!n.targetId?.startsWith('undo-comment-delete:')) {
                                    onNotificationClick(n);
                                }
                            }}
                            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition relative group ${n.read ? 'hover:bg-white/5' : 'bg-brand-800/30 hover:bg-brand-800/50'
                                }`}
                        >
                            {!n.read && (
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-500 rounded-full" />
                            )}

                            <img
                                src={n.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.senderId}`}
                                alt=""
                                className="w-10 h-10 rounded-full border border-slate-700 mt-1 shrink-0 bg-slate-800"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-200 line-clamp-2 leading-snug">
                                    <span className="font-bold text-white mr-1">{n.senderName}</span>
                                    {n.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    {getIcon(n.type)}
                                    {n.targetId?.startsWith('undo-comment-delete:') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUndo(n.targetId!);
                                            }}
                                            className="text-xs font-bold text-brand-400 hover:underline border-r border-slate-700 pr-2 mr-1"
                                        >
                                            Undo
                                        </button>
                                    )}
                                    <span className="text-[10px] text-slate-500">
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
