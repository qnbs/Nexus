import React from 'react';
import { UIContext } from './UIContext';
import { usePanelManager } from '../hooks/usePanelManager';

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const panelManager = usePanelManager();

    return (
        <UIContext.Provider value={panelManager}>
            {children}
        </UIContext.Provider>
    );
};
