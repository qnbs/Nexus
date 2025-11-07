import { useState, useEffect, useCallback } from 'react';
import { ActivePanel } from '../types';

export const usePanelManager = () => {
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const togglePanel = useCallback((panel: ActivePanel) => {
        if (panel === 'commandPalette') {
            setIsCommandPaletteOpen(p => !p);
            return;
        }
        if (panel === 'settings') {
            setIsSettingsVisible(p => !p);
            return;
        }
        if (panel === 'help') {
            setIsHelpVisible(p => !p);
            return;
        }
        setActivePanel(prev => prev === panel ? null : panel);
    }, []);

    return {
        isSettingsVisible,
        setIsSettingsVisible,
        isHelpVisible,
        setIsHelpVisible,
        activePanel,
        setActivePanel,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        togglePanel,
    };
};
