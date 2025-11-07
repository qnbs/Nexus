import { useReducer, useEffect } from 'react';
import { appReducer, initialState } from '../state/appReducer';
import * as dbService from '../services/dbService';

interface UseUserDataDeps {
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useUserData = ({ addNotification }: UseUserDataDeps) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const [history, bookmarks, learningPaths, sessionSnapshots, imageLibrary] = await Promise.all([
                    dbService.getHistory(),
                    dbService.getBookmarks(),
                    dbService.getLearningPaths(),
                    dbService.getSessionSnapshots(),
                    dbService.getAllImages()
                ]);
                dispatch({ type: 'SET_ALL_DATA', payload: { history, bookmarks, learningPaths, sessionSnapshots, imageLibrary } });
            } catch (error) {
                console.error("Failed to load user data from database:", error);
                addNotification("Could not load saved user data.", "error");
            }
        };
        loadUserData();
    }, [addNotification]);
    
    return { state, dispatch };
};
