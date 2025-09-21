import React from 'react';
import { Card } from '../UI';
import { BookCoverIcon } from '../Icons';

export const CoverCreator: React.FC = () => {
    return (
        <Card className="p-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center">
                <BookCoverIcon className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-2xl font-bold">Cover Creator</h3>
                <p className="mt-2 text-slate-400">
                    Design your book cover with our integrated creator, including a KDP calculator for perfect dimensions.
                </p>
                <p className="mt-6 text-lg font-semibold text-brand-primary">Coming Soon!</p>
            </div>
        </Card>
    );
};
