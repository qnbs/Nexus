import React, { createContext, useContext, ReactNode } from 'react';
import { Locale, LocalizationContextType } from '../types';

export type TFunction = (key: string, params?: { [key: string]: string | number | undefined }) => any;

// Redefine context type to include the TFunction type
export interface ILocalizationContext extends Omit<LocalizationContextType, 't'> {
    t: TFunction;
}

export const LocalizationContext = createContext<ILocalizationContext | null>(null);

export const useLocalization = (): ILocalizationContext => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
