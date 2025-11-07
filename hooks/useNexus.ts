import { useState, useEffect } from 'react';
import { UseNexusDeps } from './types';
import { useNotifications } from './useNotifications';
import { usePwaManager } from './usePwaManager';
import { useUserData } from './useUserData';
import { useDataManager } from './useDataManager';
import { useArticleManager } from './useArticleManager';

export const useNexus = (deps: UseNexusDeps) => {
    const { settings, setSettings, t, locale, isInitialLoad } = deps;

    // 1. Independent & State-providing Hooks
    const { notifications, addNotification } = useNotifications();
    const { state, dispatch } = useUserData({ addNotification });

    // 2. Hooks with dependencies on other hooks' outputs
    const { pwaContextValue } = usePwaManager({ addNotification, t });
    const dataManager = useDataManager({ state, settings, addNotification, t });
    const articleManager = useArticleManager({
        settings,
        t,
        locale,
        addNotification,
        dispatch,
        bookmarks: state.bookmarks,
        isInitialLoad,
    });

    // 3. Onboarding logic (depends on settings)
    const [hasOnboarded, setHasOnboarded] = useState(false);
    useEffect(() => {
        if (!isInitialLoad) {
            setHasOnboarded(!!settings.hasOnboarded);
        }
    }, [settings.hasOnboarded, isInitialLoad]);

    const handleStartOnboarding = () => {
        setHasOnboarded(true);
        setSettings(s => ({...s, hasOnboarded: true}));
    };

    // 4. Assemble final return object
    return {
        // Core state and setters
        settings,
        setSettings,
        isInitialLoad,
        hasOnboarded,
        handleStartOnboarding,
        
        // Notifications
        notifications,
        addNotification,
        
        // User Data
        state,
        dispatch,
        
        // Article Management (data-layer functions)
        ...articleManager,
        
        // Data Import/Export
        ...dataManager,

        // PWA
        pwaContextValue,
    };
};

export type UseNexusDataReturnType = ReturnType<typeof useNexus>;
