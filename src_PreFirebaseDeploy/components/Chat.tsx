import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { User, Message } from '../types';

interface ChatProps {
    currentUser: User;
    recipient: User;
    onBack: () => void;
}

const MOCK_MESSAGES: Message[] = [
    { id: '1', senderId: 'u2', receiverId: 'current-user', text: 'Hey! Are you going to Open Tap tonight?', timestamp: '2025-12-30T18:00:00.000Z' },
    { id: '2', senderId: 'current-user', receiverId: 'u2', text: 'Yeah, definitely! The vibe checks out. 🎵', timestamp: '2025-12-30T18:05:00.000Z' },
    { id: '3', senderId: 'u2', receiverId: 'current-user', text: 'Awesome, see you there around 9?', timestamp: '2025-12-30T18:06:00.000Z' },
];

export const Chat: React.FC<ChatProps> = ({ currentUser, recipient, onBack }) => {
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            receiverId: recipient.id,
            text: inputText,
            timestamp: new Date().toISOString()
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Mock Reply
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                senderId: recipient.id,
                receiverId: currentUser.id,
                text: "Sounds like a plan! 🔥",
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, reply]);
        }, 2000);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-brand-800 rounded-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-brand-900/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-brand-800 absolute top-0 w-full z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <img src={recipient.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-brand-600" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-900"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white">{recipient.displayName}</h3>
                        <span className="text-xs text-brand-400">Online</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"><Phone className="w-5 h-5" /></button>
                    <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"><Video className="w-5 h-5" /></button>
                    <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"><MoreVertical className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 space-y-4 scrollbar-thin scrollbar-thumb-brand-800 scrollbar-track-slate-900">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isMe
                                    ? 'bg-brand-600 text-white rounded-br-none'
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none'
                                }`}>
                                <p>{msg.text}</p>
                                <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-brand-200' : 'text-slate-500'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-brand-800">
                <div className="flex gap-2 items-center bg-slate-950 border border-slate-800 rounded-full px-4 py-2 focus-within:border-brand-600 transition">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message..."
                        className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
