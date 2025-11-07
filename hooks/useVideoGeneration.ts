import { useState, useCallback } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { ApiKeyNotFoundError } from '../../services/errors';

interface UseVideoGenerationProps {
    onGenerateVideo: (sectionIndex: number, onStatusUpdate: (status: string) => void) => Promise<void>;
}

export const useVideoGeneration = ({ onGenerateVideo }: UseVideoGenerationProps) => {
    const { t } = useLocalization();
    const [videoStatuses, setVideoStatuses] = useState<{ [key: number]: { status: string; error?: string } }>({});
    const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
    const [pendingVideoSectionIndex, setPendingVideoSectionIndex] = useState<number | null>(null);

    const executeVideoGeneration = useCallback(async (sectionIndex: number) => {
        setVideoStatuses(prev => ({ ...prev, [sectionIndex]: { status: t('article.video.status.start') }}));
        
        const onStatusUpdate = (status: string) => {
            setVideoStatuses(prev => ({ ...prev, [sectionIndex]: { status } }));
        };

        try {
            await onGenerateVideo(sectionIndex, onStatusUpdate);
        } catch (error: any) {
            if (error instanceof ApiKeyNotFoundError) {
                setPendingVideoSectionIndex(sectionIndex);
                setIsApiKeyModalVisible(true);
            } else {
                 const errorMessage = error.message || t('errors.videoGenerationFailed');
                 setVideoStatuses(prev => ({ ...prev, [sectionIndex]: { status: '', error: errorMessage } }));
            }
        }
    }, [onGenerateVideo, t]);
    
    const handleVideoGeneration = useCallback(async (sectionIndex: number) => {
        if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setPendingVideoSectionIndex(sectionIndex);
                setIsApiKeyModalVisible(true);
                return;
            }
        }
        executeVideoGeneration(sectionIndex);
    }, [executeVideoGeneration]);

    const handleApiKeySelect = useCallback(async () => {
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
            await (window as any).aistudio.openSelectKey();
            setIsApiKeyModalVisible(false);
            if (pendingVideoSectionIndex !== null) {
                executeVideoGeneration(pendingVideoSectionIndex);
                setPendingVideoSectionIndex(null);
            }
        }
    }, [executeVideoGeneration, pendingVideoSectionIndex]);

    return {
        videoStatuses,
        isApiKeyModalVisible,
        handleVideoGeneration,
        executeVideoGeneration,
        handleApiKeySelect,
        setIsApiKeyModalVisible,
    };
};