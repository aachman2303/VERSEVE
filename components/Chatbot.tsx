import React, { useState, useRef, useEffect } from 'react';
import { BotIcon } from './Icons';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage, GroundingSource } from '../types';

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: "You are JARVIS, an expert AI tutor and creative partner integrated into the VERSEVE learning platform. Your primary goal is to help users understand complex topics, deepen their knowledge, and stay motivated. You can search the web for up-to-date information when needed. You are an expert in explaining difficult concepts (like JEE Advanced problems) step-by-step in the simplest, most clever ways. You should be able to break down information from user-provided content (articles, videos, etc.) and answer specific questions about it. Beyond academics, you are a creative muse that can write stories, suggest innovative ideas, or even tell a good joke to lighten the mood. Always be friendly, encouraging, and highly capable, adapting your tone to the user's needs.",
                    tools: [{googleSearch: {}}]
                },
            });
            setChat(newChat);
        }
    }, [isOpen, chat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chat.sendMessage({ message: input });

            const modelResponseText = response.text;
            
            const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            const uniqueSources = new Map<string, GroundingSource>();
            rawSources.forEach((chunk: any) => {
                if (chunk.web && chunk.web.uri) uniqueSources.set(chunk.web.uri, { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            });
            const sources = Array.from(uniqueSources.values());
            
            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: modelResponseText }],
                sources: sources.length > 0 ? sources : undefined
            };
            
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-brand-accent-purple text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110 z-50 animate-pulse-glow"
                aria-label="Toggle Chatbot"
            >
                <BotIcon className="h-8 w-8" />
            </button>
            
            <div className={`fixed bottom-24 right-6 w-full max-w-md h-full max-h-[70vh] bg-brand-light dark:bg-brand-secondary-dark rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="font-bold text-lg text-center">Chat with JARVIS</h3>
                </header>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-brand-accent-purple text-white rounded-br-none' : 'bg-brand-secondary-light dark:bg-brand-dark rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 border-t border-gray-300 dark:border-gray-600 pt-2">
                                        <h5 className="text-xs font-bold mb-1">Sources:</h5>
                                        <ul className="space-y-1">
                                            {msg.sources.map((source, i) => (
                                                <li key={i}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent-teal hover:underline break-all">
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="max-w-sm rounded-2xl px-4 py-2 bg-brand-secondary-light dark:bg-brand-dark rounded-bl-none">
                                <div className="h-2 w-2 bg-gray-400 rounded-full inline-block mr-1 animate-bounce" style={{animationDelay: '0s'}}></div>
                                <div className="h-2 w-2 bg-gray-400 rounded-full inline-block mr-1 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="h-2 w-2 bg-gray-400 rounded-full inline-block animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask JARVIS anything..."
                        className="w-full bg-brand-secondary-light dark:bg-brand-dark border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent-purple"
                        disabled={isLoading}
                    />
                </form>
            </div>
        </>
    );
};