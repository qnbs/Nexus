import { createContext, useContext, RefObject } from 'react';
import { UseNexusDataReturnType } from '../hooks/useNexus';
import { UIContextType } from './UIContext';
import { SessionSnapshot } from '../types';

// The final, orchestrated API provided to the application
export type UseNexusReturnType = UseNexusDataReturnType & {
    // Orchestrated action handlers
    handleSearch: (topic: string) => Promise<void>;
    handleSerendipity: () => Promise<void>;
    handleGoHome: () => void;
    handleLoadSnapshot: (snapshot: SessionSnapshot) => void;
    mainContentRef: RefObject<HTMLDivElement>;
} & UIContextType;


export const NexusContext = createContext<UseNexusReturnType | null>(null);

export const useNexus = (): UseNexusReturnType => {
    const context = useContext(NexusContext);
    if (!context) {
        throw new Error('useNexus must be used within a NexusProvider');
    }
    return context;
};
