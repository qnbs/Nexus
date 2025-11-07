import React, { useRef, useEffect, useCallback } from 'react';
import { AppSettings, AccentColor, FontFamily, TextSize, ArticleLength, ImageStyle, Language } from '../types';
import { CloseIcon, TrashIcon, UploadIcon, DownloadIcon } from './IconComponents';
import { useNexus } from '../context/NexusContext';
import { useLocalization } from '../context/LocalizationContext';

interface SettingsModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const SettingRow: React.FC<{ label: string, description: string, children?: React.ReactNode }> = ({ label, description, children }) => (
    <div className="py-4 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <label className="block text-md font-medium text-gray-200">{label}</label>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isVisible, onClose }) => {
    const { 
        settings, 
        setSettings, 
        dispatch,
        addNotification,
        handleExportData, 
        handleTriggerImport,
        pwaContextValue
    } = useNexus();
    const { installPromptEvent, onInstallPWA } = pwaContextValue;
    const { t } = useLocalization();
    
    const modalRef = useRef<HTMLDivElement>(null);
    const memoizedOnClose = useCallback(onClose, [onClose]);

    useEffect(() => {
        if (isVisible) {
            const modalNode = modalRef.current;
            if (!modalNode) return;

            const focusableElements = Array.from(modalNode.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ));
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    memoizedOnClose();
                }
                if (e.key === 'Tab') {
                     if (e.shiftKey) { // Shift + Tab
                        if (document.activeElement === firstElement) {
                            (lastElement as HTMLElement)?.focus();
                            e.preventDefault();
                        }
                    } else { // Tab
                        if (document.activeElement === lastElement) {
                            (firstElement as HTMLElement)?.focus();
                            e.preventDefault();
                        }
                    }
                }
            };
            
            (firstElement as HTMLElement)?.focus();
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, memoizedOnClose]);
    
    const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleClearData = (type: 'CLEAR_HISTORY' | 'CLEAR_BOOKMARKS' | 'CLEAR_PATHS' | 'CLEAR_SNAPSHOTS' | 'CLEAR_IMAGES', name: string) => {
        if (window.confirm(t('prompts.confirmClearAll', { name }))) {
            dispatch({ type });
            addNotification(t('notifications.clearedAll', { name }), 'success');
        }
    };

    return (
        <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-all duration-300 ${isVisible ? 'bg-opacity-80' : 'bg-opacity-0 pointer-events-none'}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div ref={modalRef} tabIndex={-1} className={`bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="settings-title" className="text-2xl font-bold text-white">{t('settings.title')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t('settings.close')}>
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {/* Appearance Settings */}
                    <section>
                        <h3 className="text-xl font-semibold text-accent mb-2">{t('settings.appearance.title')}</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 divide-y divide-gray-700/50">
                            <SettingRow label={t('settings.appearance.accentColor.label')} description={t('settings.appearance.accentColor.description')}>
                                <select
                                    value={settings.accentColor}
                                    onChange={e => handleSettingChange('accentColor', e.target.value as AccentColor)}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    {Object.values(AccentColor).map(c => <option key={c} value={c}>{t(`settings.appearance.accentColor.${c}`)}</option>)}
                                </select>
                            </SettingRow>
                            <SettingRow label={t('settings.appearance.font.label')} description={t('settings.appearance.font.description')}>
                                <select
                                    value={settings.fontFamily}
                                    onChange={e => handleSettingChange('fontFamily', e.target.value as FontFamily)}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    {Object.values(FontFamily).map(f => <option key={f} value={f}>{t(`settings.appearance.font.${f}`)}</option>)}
                                </select>
                            </SettingRow>
                             <SettingRow label={t('settings.appearance.textSize.label')} description={t('settings.appearance.textSize.description')}>
                                <select
                                    value={settings.textSize}
                                    onChange={e => handleSettingChange('textSize', e.target.value as TextSize)}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    {Object.values(TextSize).map(s => <option key={s} value={s}>{t(`settings.appearance.textSize.${s}`)}</option>)}
                                </select>
                            </SettingRow>
                        </div>
                    </section>

                    {/* Content Settings */}
                    <section>
                        <h3 className="text-xl font-semibold text-accent mb-2">{t('settings.content.title')}</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 divide-y divide-gray-700/50">
                             <SettingRow label={t('settings.content.language.label')} description={t('settings.content.language.description')}>
                                <select
                                    value={settings.language}
                                    onChange={e => handleSettingChange('language', e.target.value as Language)}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    {Object.values(Language).map(l => <option key={l} value={l}>{t(`settings.content.language.${l}`)}</option>)}
                                </select>
                             </SettingRow>
                             <SettingRow label={t('settings.content.articleLength.label')} description={t('settings.content.articleLength.description')}>
                                <select
                                    value={settings.articleLength}
                                    onChange={e => handleSettingChange('articleLength', e.target.value as ArticleLength)}
                                    className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                    {Object.values(ArticleLength).map(l => <option key={l} value={l}>{t(`settings.content.articleLength.${l}`)}</option>)}
                                </select>
                            </SettingRow>
                            <SettingRow label={t('settings.content.imageStyle.label')} description={t('settings.content.imageStyle.description')}>
                                <select
                                    value={settings.imageStyle}
                                    onChange={e => handleSettingChange('imageStyle', e.target.value as ImageStyle)}
                                    className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                >
                                     {Object.values(ImageStyle).map(s => <option key={s} value={s}>{t(`settings.content.imageStyle.${s}`)}</option>)}
                                </select>
                            </SettingRow>
                             <SettingRow label={t('settings.content.autoLoad.label')} description={t('settings.content.autoLoad.description')}>
                                 <input
                                    type="checkbox"
                                    checked={settings.autoLoadImages}
                                    onChange={e => handleSettingChange('autoLoadImages', e.target.checked)}
                                    className="h-6 w-6 rounded text-accent bg-gray-700 border-gray-600 focus:ring-accent"
                                />
                            </SettingRow>
                             <SettingRow label={t('settings.content.synapseDensity.label')} description={t('settings.content.synapseDensity.description')}>
                                 <div className="flex items-center gap-3">
                                    <span className="w-4 text-center">{settings.synapseDensity}</span>
                                    <input
                                        type="range"
                                        min="3"
                                        max="7"
                                        step="1"
                                        value={settings.synapseDensity}
                                        onChange={e => handleSettingChange('synapseDensity', parseInt(e.target.value, 10))}
                                        className="w-36 accent-accent-color"
                                    />
                                </div>
                            </SettingRow>
                        </div>
                    </section>
                    
                    {/* Data Management */}
                     <section>
                        <h3 className="text-xl font-semibold text-accent mb-2">{t('settings.data.title')}</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                            {installPromptEvent && (
                                <div className="pb-4 mb-4 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <label className="block text-md font-medium text-gray-200">{t('settings.data.installApp.label')}</label>
                                        <p className="text-sm text-gray-400 mt-1">{t('settings.data.installApp.description')}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button onClick={onInstallPWA} className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/40 transition-colors font-semibold">
                                            <DownloadIcon className="w-5 h-5" /> {t('settings.data.installApp.button')}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => handleClearData('CLEAR_HISTORY', 'History')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> {t('settings.data.clearHistory')}
                                </button>
                                <button onClick={() => handleClearData('CLEAR_BOOKMARKS', 'Bookmarks')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> {t('settings.data.clearBookmarks')}
                                </button>
                                <button onClick={() => handleClearData('CLEAR_PATHS', 'Learning Paths')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> {t('settings.data.clearPaths')}
                                </button>
                                <button onClick={() => handleClearData('CLEAR_SNAPSHOTS', 'Snapshots')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> {t('settings.data.clearSnapshots')}
                                </button>
                                <button onClick={() => handleClearData('CLEAR_IMAGES', 'Image Library')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600/40 transition-colors">
                                    <TrashIcon className="w-5 h-5" /> {t('settings.data.clearImageLibrary')}
                                </button>
                            </div>
                             <div className="mt-6 pt-4 border-t border-gray-700/50 flex flex-col md:flex-row gap-4">
                                <button onClick={handleExportData} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-lg hover:bg-sky-600/40 transition-colors">
                                    <DownloadIcon className="w-5 h-5" /> {t('settings.data.export')}
                                </button>
                                <button onClick={handleTriggerImport} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-sky-600/20 text-sky-300 border border-sky-500/30 rounded-lg hover:bg-sky-600/40 transition-colors">
                                    <UploadIcon className="w-5 h-5" /> {t('settings.data.import')}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;