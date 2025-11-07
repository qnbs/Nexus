import { useState, useCallback, RefObject } from 'react';

export type InteractionMode = 'Define' | 'Explain' | 'Visualize' | null;

export const useTextInteraction = (articleRef: RefObject<HTMLDivElement>) => {
    const [selectedText, setSelectedText] = useState('');
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
    const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);

    const handleMouseUp = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? '';

        if (text && articleRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const articleRect = articleRef.current.getBoundingClientRect();
            setSelectedText(text);
            setToolbarPos({
                top: rect.top - articleRect.top,
                left: rect.left - articleRect.left + rect.width / 2,
            });
        } else {
            setSelectedText('');
            setToolbarPos(null);
        }
    }, [articleRef]);

    const handleInteraction = (action: NonNullable<InteractionMode>) => {
        setInteractionMode(action);
        setToolbarPos(null);
    };
    
    const closeInteractionModal = useCallback(() => {
        setInteractionMode(null);
    }, []);

    return {
        selectedText,
        toolbarPos,
        interactionMode,
        handleMouseUp,
        handleInteraction,
        closeInteractionModal,
    };
};
