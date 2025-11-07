import React from 'react';
import { AppSettings, Locale } from '../types';
import { TFunction } from '../context/LocalizationContext';

export interface UseNexusDeps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    t: TFunction;
    locale: Locale;
    isInitialLoad: boolean;
}
