import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import * as geminiService from '../services/geminiService';
import { useLocalization } from '../context/LocalizationContext';
import { InteractionMode } from './useTextInteraction';
import { useArticle } from '../context/ArticleContext';

interface UseInteractionModalProps {
    mode: InteractionMode;
    text: string;
    settings: AppSettings;
}

export const useInteractionModal = ({ mode, text, settings }: UseInteractionModalProps) => {
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { locale } = useLocalization();

    useEffect(() => {
        if (!mode || !text) return;
        
        let isCancelled = false;
        
        const fetchInteraction = async () => {
            setIsLoading(true);
            setResult('');
            try {
                const response = await geminiService.explainOrDefine(text, mode, settings, locale);
                if (!isCancelled) {
                    setResult(response);
                }
            } catch (err: unknown) {
                 if (!isCancelled) {
                    const message = err instanceof Error ? err.message : String(err);
                    setResult(message);
                }
            } finally {
                 if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchInteraction();
        
        return () => {
            isCancelled = true;
        };

    }, [mode, text, settings, locale]);
    
    return { result, isLoading };
};