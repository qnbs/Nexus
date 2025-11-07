import { useRef, useCallback, ChangeEvent } from 'react';
import { AppSettings, NexusBackupData } from '../types';
import { AppState } from '../state/appReducer';
import * as dbService from '../services/dbService';
import { TFunction } from '../context/LocalizationContext';

interface UseDataManagerDeps {
    state: AppState;
    settings: AppSettings;
    addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    t: TFunction;
}

export const useDataManager = ({ state, settings, addNotification, t }: UseDataManagerDeps) => {
    const importFileRef = useRef<HTMLInputElement | null>(null);
    const { history, bookmarks, learningPaths, sessionSnapshots, imageLibrary } = state;

    const handleExportData = useCallback(() => {
        const backupData: NexusBackupData = {
            settings, history, bookmarks, learningPaths, sessionSnapshots, imageLibrary,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `nexus_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        addNotification(t('notifications.exportSuccess'), 'success');
    }, [settings, history, bookmarks, learningPaths, sessionSnapshots, imageLibrary, addNotification, t]);

    const handleImportData = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error(t('errors.fileRead'));
                const data: NexusBackupData = JSON.parse(text);

                if (!data.settings || !data.history || !data.bookmarks) {
                    throw new Error(t('errors.invalidBackup'));
                }
                
                await dbService.clearHistory();
                await dbService.clearBookmarks();
                await dbService.clearLearningPaths();
                await dbService.clearSessionSnapshots();
                await dbService.clearImages();

                await dbService.saveSettings(data.settings);
                for (const h of data.history) { await dbService.addHistoryItem(h); }
                for (const b of data.bookmarks) { await dbService.addBookmark(b); }
                if (data.learningPaths) await dbService.saveLearningPaths(data.learningPaths);
                if (data.sessionSnapshots) await dbService.saveSessionSnapshots(data.sessionSnapshots);
                if (data.imageLibrary) await dbService.bulkAddImages(data.imageLibrary);

                addNotification(t('notifications.importSuccess'), 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error: any) {
                addNotification(error.message || t('errors.importFailed'), 'error');
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    }, [addNotification, t]);

    const handleTriggerImport = useCallback(() => importFileRef.current?.click(), []);

    return { importFileRef, handleExportData, handleImportData, handleTriggerImport };
};
