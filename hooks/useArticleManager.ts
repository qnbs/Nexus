import React, { useState, useCallback, useRef, useMemo } from 'react';
import { AppSettings, ArticleData, RelatedTopic, ChatMessage, NotificationType, SessionSnapshot, StoredImage, AthenaCopilotRef, Locale } from '../types';
import * as geminiService from '../services/geminiService';
import { TFunction } from '../context/LocalizationContext';
import { AppAction } from '../state/appReducer';

interface UseArticleManagerDeps {
    settings: AppSettings;
    t: TFunction;
    locale: Locale;
    addNotification: (message: string, type?: NotificationType) => void;
    dispatch: React.Dispatch<AppAction>;
    bookmarks: string[];
    isInitialLoad: boolean;
}

export const useArticleManager = (deps: UseArticleManagerDeps) => {
    const { settings, t, locale, addNotification, dispatch, bookmarks } = deps;

    const [currentTopic, setCurrentTopic] = useState<string | null>(null);
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [relatedTopics, setRelatedTopics] = useState<RelatedTopic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadedSnapshotHistory, setLoadedSnapshotHistory] = useState<ChatMessage[] | undefined>(undefined);

    const athenaRef = useRef<AthenaCopilotRef>(null);
    const searchIdRef = useRef(0);

    const isBookmarked = useMemo(() => !!currentTopic && bookmarks.includes(currentTopic), [currentTopic, bookmarks]);
    
    const addImageToLibrary = useCallback((imageData: { imageUrl: string, prompt: string, topic: string }) => {
        const newImage: StoredImage = { id: Date.now(), timestamp: Date.now(), ...imageData };
        dispatch({ type: 'ADD_IMAGE', payload: newImage });
    }, [dispatch]);
    
    const generateAllImages = useCallback(async (articleToProcess: ArticleData) => {
        const indicesToGenerate = articleToProcess.sections
            .map((s, i) => (s.imagePrompt && !s.imageUrl) ? i : -1)
            .filter(i => i !== -1);

        if (indicesToGenerate.length === 0) {
            addNotification(t('notifications.allImagesGenerated'), 'info');
            return;
        }

        const generateImageFn = async (sectionIndex: number, currentArticle: ArticleData) => {
            const section = currentArticle.sections[sectionIndex];
            if (!section.imagePrompt) return;
    
            try {
                const imageUrl = await geminiService.generateImageForSection(section.imagePrompt, settings, locale);
                setArticle(prev => {
                    if (!prev || prev.title !== currentArticle.title) return prev;
                    const newSections = [...prev.sections];
                    newSections[sectionIndex].imageUrl = imageUrl;
                    return { ...prev, sections: newSections };
                });
                 addImageToLibrary({
                    imageUrl: imageUrl,
                    prompt: section.imagePrompt,
                    topic: currentArticle.title,
                });
            } catch (error: any) {
                addNotification(error.message || t('errors.imageGenSectionFailed', { section: section.heading }), 'error');
            }
        };

        addNotification(t('article.generatingAllImages', { count: indicesToGenerate.length }), 'info');
        
        await Promise.all(indicesToGenerate.map(index => generateImageFn(index, articleToProcess)));
        addNotification(t('notifications.imagesGeneratedSuccess', { count: indicesToGenerate.length }), 'success');
    }, [settings, locale, addNotification, t, addImageToLibrary]);

    const handleSearch = useCallback(async (topic: string) => {
        if (!topic || isLoading) return;

        const currentSearchId = ++searchIdRef.current;

        setIsLoading(true);
        setArticle(null);
        setCurrentTopic(topic);
        setRelatedTopics([]);
        setLoadedSnapshotHistory(undefined);

        try {
            setLoadingMessage(t('article.creating'));
            const articleData = await geminiService.generateArticleContent(topic, settings, locale);
            
            if (currentSearchId !== searchIdRef.current) return;
            setArticle(articleData);
            
            dispatch({ type: 'ADD_HISTORY', payload: topic });

            if (settings.autoLoadImages) {
                 if (currentSearchId === searchIdRef.current) {
                    await generateAllImages(articleData);
                }
            }
            
            const related = await geminiService.getRelatedTopics(topic, settings, locale);
             if (currentSearchId === searchIdRef.current) {
                setRelatedTopics(related);
            }

        } catch (error: any) {
             if (currentSearchId === searchIdRef.current) {
                console.error(error);
                addNotification(error.message || t('errors.articleCreationFailed', { topic }), 'error');
                setCurrentTopic(null);
            }
        } finally {
            if (currentSearchId === searchIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [isLoading, settings, t, locale, addNotification, dispatch, generateAllImages]);

    const handleGoHome = () => {
        setArticle(null);
        setCurrentTopic(null);
        setRelatedTopics([]);
        setLoadedSnapshotHistory(undefined);
    };

    const handleSerendipity = useCallback(async () => {
        setIsLoading(true);
        setLoadingMessage(t('notifications.findingConnection'));
        try {
            const newTopic = await geminiService.getSerendipitousTopic(currentTopic ?? 'philosophy', locale);
            addNotification(t('notifications.cosmicLeapFound', { topic: newTopic }), 'info');
            await handleSearch(newTopic);
        } catch (error: any) {
            addNotification(error.message || t('errors.cosmicLeapFailed'), 'error');
            setIsLoading(false);
        }
    }, [currentTopic, locale, addNotification, handleSearch, t]);
    
    const generateImage = useCallback(async (sectionIndex: number, currentArticle: ArticleData) => {
        const section = currentArticle.sections[sectionIndex];
        if (!section.imagePrompt) return;

        try {
            const imageUrl = await geminiService.generateImageForSection(section.imagePrompt, settings, locale);
            setArticle(prev => {
                if (!prev || prev.title !== currentArticle.title) return prev;
                const newSections = [...prev.sections];
                newSections[sectionIndex].imageUrl = imageUrl;
                return { ...prev, sections: newSections };
            });
             addImageToLibrary({
                imageUrl: imageUrl,
                prompt: section.imagePrompt,
                topic: currentArticle.title,
            });
        } catch (error: any) {
            addNotification(error.message || t('errors.imageGenSectionFailed', { section: section.heading }), 'error');
        }
    }, [settings, locale, addNotification, t, addImageToLibrary]);

     const generateVideo = useCallback(async (sectionIndex: number, onStatusUpdate: (status: string) => void) => {
        if (!article) return;
        const section = article.sections[sectionIndex];
        if (!section.imagePrompt) {
            const errorMessage = t('errors.noPromptForVideo');
            addNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        const videoUrl = await geminiService.generateVideoForSection(section.imagePrompt, settings, locale, onStatusUpdate);
        setArticle((prev) => {
            if (!prev) return null;
            const newSections = [...prev.sections];
            newSections[sectionIndex].videoUrl = videoUrl;
            return { ...prev, sections: newSections };
        });
        addNotification(t('notifications.videoGeneratedSuccess'), 'success');
    }, [article, settings, locale, addNotification, t]);

    const handleSaveSnapshot = () => {
        if (!article || !currentTopic) return;
        const name = prompt(t('prompts.snapshotName'), `${currentTopic} - ${new Date().toLocaleString()}`);
        if (name) {
            const chatHistory = athenaRef.current?.getChatHistory() || [];
            const snapshot: SessionSnapshot = {
                name,
                timestamp: Date.now(),
                topic: currentTopic,
                article,
                relatedTopics,
                chatHistory,
            };
            dispatch({ type: 'SAVE_SNAPSHOT', payload: snapshot });
            addNotification(t('notifications.snapshotSaved', { name }), 'success');
        }
    };
    
    const handleLoadSnapshot = (snapshot: SessionSnapshot) => {
        setArticle(snapshot.article);
        setCurrentTopic(snapshot.topic);
        setRelatedTopics(snapshot.relatedTopics);
        setLoadedSnapshotHistory(snapshot.chatHistory);
        addNotification(t('notifications.snapshotRestored', { name: snapshot.name }), 'success');
    };

    return {
        currentTopic,
        article,
        setArticle,
        relatedTopics,
        isLoading,
        loadingMessage,
        loadedSnapshotHistory,
        isBookmarked,
        athenaRef,
        handleSearch,
        handleGoHome,
        handleSerendipity,
        generateImage,
        generateAllImages,
        generateVideo,
        handleSaveSnapshot,
        handleLoadSnapshot,
        addImageToLibrary,
    };
};
