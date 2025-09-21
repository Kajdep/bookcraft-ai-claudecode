import React, { useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon } from '../Icons';
import { log } from '../../services/logger';

interface PlottingToolModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PlottingToolModal: React.FC<PlottingToolModalProps> = ({ isOpen, onClose }) => {
    const generatePlotPoints = useBookCraftStore(state => state.generatePlotPoints);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            await generatePlotPoints(prompt);
            onClose(); // Close on success
        } catch (error) {
            log.error('Failed to generate plot points', error as Error, 'PlottingToolModal');
            alert("Sorry, there was an error generating the plot.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPrompt('');
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="AI Plotting Tool">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="plot-prompt" className="block text-sm font-medium text-slate-300 mb-1">
                        Describe your story idea
                    </label>
                    <textarea
                        id="plot-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={'e.g., "A detective in a cyberpunk city has to solve the murder of a high-profile CEO, but the main suspect is an advanced android who claims innocence."'}
                        rows={5}
                        className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        required
                    />
                 </div>
                 <p className="text-sm text-slate-400">
                     The AI will generate a structured plot outline based on your idea, including key points like the inciting incident, rising action, climax, and resolution.
                 </p>
                 <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Generating Plot...' : 'Generate Plot'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};