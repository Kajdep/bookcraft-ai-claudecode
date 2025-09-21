import React from 'react';
import { Card } from '../UI';
import { PaperClipIcon } from '../Icons';

export const MaterialTab: React.FC = () => {
    return (
        <Card className="p-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center">
                <PaperClipIcon className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-2xl font-bold">Project Materials</h3>
                <p className="mt-2 text-slate-400">
                    Keep all your notes, links, images, and other reference materials organized in one place.
                </p>
                <p className="mt-6 text-lg font-semibold text-brand-primary">Coming Soon!</p>
            </div>
        </Card>
    );
};
