


import React from 'react';
import { useNexus } from '../context/NexusContext';
import { useLocalization } from '../context/LocalizationContext';
import { ArticleProvider } from '../context/ArticleContext';

import Header from './Header';
import WelcomeScreen from './WelcomeScreen';
import RightSidebar from './RightSidebar';
import ArticleView from './ArticleView';
import SynapseGraph from './SynapseGraph';
import LoadingSpinner from './LoadingSpinner';
import EntryPortal from './EntryPortal';
import CommandPalette from './CommandPalette';
import SettingsModal from './SettingsModal';
import HelpGuide from './HelpGuide';
import MobilePanel from './MobilePanel';
// FIX: Added missing import for BottomNavBar component.
import BottomNavBar from './BottomNavBar';
import { ExclamationTriangleIcon, InformationCircleIcon } from './IconComponents';

const MainLayout: React.FC = () => {
    const {
        settings, state, notifications, isInitialLoad, hasOnboarded, currentTopic,
        article, setArticle, relatedTopics, isLoading, loadingMessage, isBookmarked,
        isSettingsVisible, isHelpVisible, isCommandPaletteOpen,
        mainContentRef, athenaRef, importFileRef,
        handleSearch, handleSerendipity, handleStartOnboarding, togglePanel, handleImportData,
        setIsCommandPaletteOpen, addNotification, addImageToLibrary,
        generateImage, generateAllImages, generateVideo, dispatch,
    } = useNexus();
    
    const { t, isLoading: isLocalizationLoading } = useLocalization();

    if (isInitialLoad || isLocalizationLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (!hasOnboarded) {
        return <EntryPortal onStart={handleStartOnboarding} />;
    }

    const handleToggleBookmark = (topic: string) => {
        const wasBookmarked = state.bookmarks.includes(topic);
        dispatch({ type: 'TOGGLE_BOOKMARK', payload: topic });
        if (wasBookmarked) {
            addNotification(t('notifications.bookmarkRemoved', { topic }));
        } else {
            addNotification(t('notifications.bookmarkAdded', { topic }), 'success');
        }
    };
    
    const articleContextValue = article && currentTopic ? {
        article,
        setArticle,
        isBookmarked,
        settings,
        currentTopic,
        onToggleBookmark: () => handleToggleBookmark(currentTopic),
        onGenerateImage: (idx: number) => generateImage(idx, article),
        onGenerateAllImages: () => generateAllImages(article),
        onGenerateVideo: generateVideo,
        addImageToLibrary,
    } : null;

    return (
        <div className={`font-${settings.fontFamily} bg-gray-900 text-gray-200 min-h-screen flex flex-col md:flex-row transition-colors duration-500`}>
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onSearch={handleSearch}
                onSerendipity={handleSerendipity}
                article={article}
                onGenerateAllImages={() => article && generateAllImages(article)}
            />
            <SettingsModal 
                isVisible={isSettingsVisible} 
                onClose={() => togglePanel('settings')} 
            />
            <HelpGuide isVisible={isHelpVisible} onClose={() => togglePanel('help')} />

            <MobilePanel athenaRef={athenaRef} />

            <div className="flex-grow flex flex-col h-screen overflow-hidden">
                <Header />
                <main ref={mainContentRef} className="flex-grow overflow-y-auto pb-20 md:pb-0">
                    {isLoading && !article && (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner text={loadingMessage} />
                        </div>
                    )}
                    {!isLoading && !article && <WelcomeScreen />}
                    {articleContextValue && (
                        <ArticleProvider value={articleContextValue}>
                            <div className={`text-${settings.textSize}`}>
                                <ArticleView />
                                <SynapseGraph
                                    relatedTopics={relatedTopics}
                                    currentTopic={currentTopic!}
                                    onTopicSelect={handleSearch}
                                    onSerendipity={handleSerendipity}
                                />
                            </div>
                        </ArticleProvider>
                    )}
                </main>
            </div>

            <RightSidebar athenaRef={athenaRef} />
            <BottomNavBar />

            {/* Notifications & Global Elements */}
            <input type="file" ref={importFileRef} onChange={handleImportData} className="hidden" accept=".json" />
            <div className="fixed bottom-20 md:bottom-4 right-4 z-[100] space-y-2">
                {notifications.map(n => (
                    <div key={n.id} className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-white animate-fade-in-down ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                        {n.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
                        {n.type === 'info' && <InformationCircleIcon className="w-5 h-5" />}
                        <span>{n.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MainLayout;