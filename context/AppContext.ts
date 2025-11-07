import { createContext } from 'react';
import { BeforeInstallPromptEvent } from '../types';

// This file is being refactored. The old contexts are being replaced.
// For now, we will create the PWA context here.
// The main context will be in CodexContext.ts

export interface PWAContextType {
    installPromptEvent: BeforeInstallPromptEvent | null;
    onInstallPWA: () => void;
}
export const PWAContext = createContext<PWAContextType | null>(null);