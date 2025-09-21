import React from 'react';
import { WritingDesk } from './WritingDesk';

export const WritingStudio: React.FC = () => {
    // This component could hold project-wide writing settings in the future,
    // but for now, it's a simple container for the WritingDesk.
    return (
        <div className="animate-fade-in">
            <WritingDesk />
        </div>
    );
};
