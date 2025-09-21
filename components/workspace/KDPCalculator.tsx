import React from 'react';
import { Card } from '../UI';
import { CalculatorIcon } from '../Icons';

export const KDPCalculator: React.FC = () => {
    return (
        <Card className="p-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center">
                <CalculatorIcon className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-2xl font-bold">KDP Calculator</h3>
                <p className="mt-2 text-slate-400">
                    This tool will help you calculate page layout, cover dimensions, margins, and bleed for KDP publishing.
                </p>
                <p className="mt-6 text-lg font-semibold text-brand-primary">Coming Soon!</p>
            </div>
        </Card>
    );
};
