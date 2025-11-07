// FIX: Added import for React to resolve namespace errors.
import React, { useState, useCallback } from 'react';
import { ArticleData } from '../types';
import { useLocalization } from '../context/LocalizationContext';

interface UseImageEditingProps {
    article: ArticleData;
    setArticle: React.Dispatch<React.SetStateAction<ArticleData | null>>;
    addImageToLibrary: (imageData: { imageUrl: string; prompt: string; topic: string; }) => void;
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useImageEditing = ({ article, setArticle, addImageToLibrary, addNotification }: UseImageEditingProps) => {
    const { t } = useLocalization();
    const [editingImage, setEditingImage] = useState<{ sectionIndex: number, imageUrl: string } | null>(null);

    const handleEditComplete = useCallback((newImageUrl: string, editPrompt: string, sectionIndex: number) => {
        const originalPrompt = article.sections[sectionIndex].imagePrompt || '';
        const combinedPrompt = t('panels.imageLibrary.editedPrompt', { editPrompt, originalPrompt });
        
        addImageToLibrary({
            imageUrl: newImageUrl,
            prompt: combinedPrompt,
            topic: article.title,
        });
        
        setArticle(prevArticle => {
            if (!prevArticle) return null;
            const newSections = [...prevArticle.sections];
            newSections[sectionIndex] = { ...newSections[sectionIndex], imageUrl: newImageUrl };
            return { ...prevArticle, sections: newSections };
        });

        addNotification(t('notifications.imageEditedSuccess'), 'success');
    }, [article, setArticle, addImageToLibrary, addNotification, t]);

    const openEditModal = useCallback((sectionIndex: number, imageUrl: string) => {
        setEditingImage({ sectionIndex, imageUrl });
    }, []);
    
    const closeEditModal = useCallback(() => {
        setEditingImage(null);
    }, []);

    return {
        editingImage,
        openEditModal,
        closeEditModal,
        handleEditComplete,
    };
};