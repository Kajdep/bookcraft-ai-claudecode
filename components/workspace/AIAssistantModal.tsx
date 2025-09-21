import React, { useState, useRef, useEffect } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import type { Chapter } from '../../types';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon } from '../Icons';
import { log } from '../../services/logger';

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapter: Chapter;
    onGenerated: (text: string) => void;
}

type Message = {
    sender: 'user' | 'ai';
    text: string;
};

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, chapter, onGenerated }) => {
    const getAIAssistantResponse = useBookCraftStore(state => state.getAIAssistantResponse);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset conversation when modal is opened
        if (isOpen) {
            setConversation([]);
        }
    }, [isOpen]);
    
     useEffect(() => {
        // Scroll to bottom of chat
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: prompt };
        setConversation(prev => [...prev, userMessage]);
        setPrompt('');
        setIsLoading(true);

        try {
            const aiText = await getAIAssistantResponse(chapter.id, prompt);
            const aiMessage: Message = { sender: 'ai', text: aiText };
            setConversation(prev => [...prev, aiMessage]);
        } catch (error) {
            log.error('Failed to get AI assistant response', error as Error, 'AIAssistantModal');
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I couldn't process that request." };
            setConversation(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseText = (text: string) => {
        onGenerated(text);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Writing Assistant">
            <div className="flex flex-col h-[60vh]">
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 mb-4">
                    {conversation.length === 0 && (
                        <div className="text-center p-4 text-slate-400">
                           <p>Ask me anything about this chapter!</p>
                           <p className="text-sm mt-2">e.g., "Write some dialogue," "Suggest a plot twist," or "Describe the setting."</p>
                        </div>
                    )}
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-sm ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.sender === 'ai' && (
                                    <div className="text-right mt-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleUseText(msg.text)}>
                                            Use Text
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex justify-start">
                             <div className="p-3 rounded-lg bg-slate-700">
                                <Spinner size="sm" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="flex-shrink-0 flex gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ask the assistant..."
                        className="flex-grow bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !prompt.trim()}>
                        Send
                    </Button>
                </form>
            </div>
        </Modal>
    );
};