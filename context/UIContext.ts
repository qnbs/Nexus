import { createContext, useContext } from 'react';
import { usePanelManager } from '../hooks/usePanelManager';

// The shape of the context value will be the return type of our hook
export type UIContextType = ReturnType<typeof usePanelManager>;

export const UIContext = createContext<UIContextType | null>(null);

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
