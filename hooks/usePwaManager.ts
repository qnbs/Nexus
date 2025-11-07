import { useState, useEffect, useCallback, useMemo } from 'react';
import { TFunction } from '../context/LocalizationContext';
import { BeforeInstallPromptEvent } from '../types';

interface UsePwaManagerDeps {
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    t: TFunction;
}

export const usePwaManager = ({ addNotification, t }: UsePwaManagerDeps) => {
    const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setInstallPromptEvent(null);
            addNotification(t('notifications.installSuccess'), 'success');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [addNotification, t]);

    const onInstallPWA = useCallback(async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;
        if (outcome === 'dismissed') {
            addNotification(t('notifications.installDismissed'), 'info');
        }
        setInstallPromptEvent(null);
    }, [installPromptEvent, addNotification, t]);
    
    const pwaContextValue = useMemo(() => ({ installPromptEvent, onInstallPWA }), [installPromptEvent, onInstallPWA]);

    return { pwaContextValue };
};