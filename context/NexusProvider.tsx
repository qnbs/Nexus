import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NexusContext } from './NexusContext';
import { useNexus as useNexusHook } from '../hooks/useNexus';
import { LocalizationContext, TFunction } from './LocalizationContext';
import { PWAContext } from './AppContext';
import { AppSettings, Language, Locale, SessionSnapshot } from '../types';
import * as dbService from '../services/dbService';
import { DEFAULT_SETTINGS } from '../App';
// FIX: UIProvider is exported from UIProvider.tsx, not UIContext.ts
import { useUI } from './UIContext';
import { UIProvider } from './UIProvider';


// This component now contains all the top-level state and provider logic.
const Orchestrator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Settings state management
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        dbService.getSettings(DEFAULT_SETTINGS).then(s => {
            setSettings(s);
            setIsInitialLoad(false);
        });
    }, []);

    useEffect(() => {
        if (!isInitialLoad) {
            dbService.saveSettings(settings);
        }
    }, [settings, isInitialLoad]);

    // 2. Localization logic
    const [translations, setTranslations] = useState<any>({});
    const [isLocLoading, setIsLocLoading] = useState(true);
    const locale: Locale = settings?.language ?? 'en';

    useEffect(() => {
        // Always load english for fallbacks
        fetch('./locales/en.json')
            .then(res => res.json())
            .then(data => setTranslations(prev => ({...prev, en: data})))
            .catch(e => console.error("Failed to load english locale", e));
    }, []);

    useEffect(() => {
        const isEnglishReady = !!translations.en;
        const isCurrentLocaleReady = locale === 'en' || !!translations[locale];

        if (isEnglishReady && isCurrentLocaleReady) {
            setIsLocLoading(false);
        } else if (locale !== 'en' && !translations[locale]) {
            setIsLocLoading(true);
            fetch(`./locales/${locale}.json`)
                .then(res => res.json())
                .then(data => setTranslations(t => ({ ...t, [locale]: data })))
                .catch(err => console.error(`Failed to load ${locale} locale`, err));
        }
    }, [locale, translations]);

    const t = useCallback<TFunction>((key, params) => {
        const lang = translations[locale] || translations.en || {};
        const keys = key.split('.');
        let result: any = lang;
        for (const k of keys) {
            result = result?.[k];
        }

        if (result === undefined) {
            let fallbackResult: any = translations.en || {};
            for (const k of keys) {
                fallbackResult = fallbackResult?.[k];
            }
            if(fallbackResult !== undefined) {
                result = fallbackResult;
            } else {
                return key;
            }
        }
        
        if (typeof result === 'string' && params) {
            return Object.entries(params).reduce((str, [paramKey, val]) => {
                return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(val ?? ''));
            }, result);
        }
        return result;
    }, [locale, translations]);
    
    const setLocale = (newLocale: Locale) => {
        setSettings(s => ({ ...s, language: newLocale as Language }));
    };

    const localizationValue = { locale, setLocale, t, isLoading: isLocLoading };

    // --- CONTEXT ORCHESTRATION ---
    const nexusData = useNexusHook({ settings, setSettings, t, locale, isInitialLoad });
    const uiData = useUI();
    const mainContentRef = useRef<HTMLDivElement>(null);

    // Create orchestrated functions that combine data logic and UI side-effects
    const handleSearch = useCallback(async (topic: string) => {
        mainContentRef.current?.scrollTo(0, 0);
        uiData.setActivePanel(null);
        await nexusData.handleSearch(topic);
    }, [nexusData.handleSearch, uiData.setActivePanel]);

    const handleSerendipity = useCallback(async () => {
        mainContentRef.current?.scrollTo(0, 0);
        uiData.setActivePanel(null);
        await nexusData.handleSerendipity();
    }, [nexusData.handleSerendipity, uiData.setActivePanel]);
    
    const handleGoHome = useCallback(() => {
        mainContentRef.current?.scrollTo(0, 0);
        uiData.setActivePanel(null);
        nexusData.handleGoHome();
    }, [nexusData.handleGoHome, uiData.setActivePanel]);

    const handleLoadSnapshot = useCallback((snapshot: SessionSnapshot) => {
        mainContentRef.current?.scrollTo(0, 0);
        uiData.setActivePanel(null);
        nexusData.handleLoadSnapshot(snapshot);
    }, [nexusData.handleLoadSnapshot, uiData.setActivePanel]);

    // Deep linking effect
    useEffect(() => {
        if (isInitialLoad) return;
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action) {
            const timeoutId = setTimeout(() => {
                if (action === 'cosmic_leap') handleSerendipity();
                else if (action === 'bookmarks') uiData.togglePanel('bookmarks');
            }, 500);
            window.history.replaceState({}, document.title, window.location.pathname);
            return () => clearTimeout(timeoutId);
        }
    }, [isInitialLoad, handleSerendipity, uiData.togglePanel]);
    

    const finalContextValue = {
        ...nexusData,
        ...uiData,
        handleSearch,
        handleSerendipity,
        handleGoHome,
        handleLoadSnapshot,
        mainContentRef,
    };
    
    return (
        <LocalizationContext.Provider value={localizationValue}>
            <NexusContext.Provider value={finalContextValue}>
                <PWAContext.Provider value={nexusData.pwaContextValue}>
                    {children}
                </PWAContext.Provider>
            </NexusContext.Provider>
        </LocalizationContext.Provider>
    );
};

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <UIProvider>
            <Orchestrator>
                {children}
            </Orchestrator>
        </UIProvider>
    );
};