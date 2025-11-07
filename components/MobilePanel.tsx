import React, { useEffect, useRef } from 'react';
import { MobilePanelProps, SessionSnapshot, StoredImage } from '../types';
import { useLocalization } from '../context/LocalizationContext';
import { useNexus } from '../context/NexusContext';
import { 
    CloseIcon, TrashIcon, CameraIcon, DownloadIcon, HistoryIcon, BookmarkIcon
} from './IconComponents';
import LearningPathsManager from './LearningPathsManager';
import AthenaCopilot from './AthenaCopilot';

const PanelHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
    <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close panel">
            <CloseIcon className="w-6 h-6" />
        </button>
    </div>
);

// Memoized item renderers for performance
const HistoryItem = React.memo(({ item, onSelect, onDelete, Icon }: { item: string, onSelect: (i: string) => void, onDelete: (i: string) => void, Icon: React.FC<{className?:string}> }) => (
    <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 group">
        <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <button onClick={() => onSelect(item)} className="flex-grow text-left text-gray-300 truncate">{item}</button>
        <button onClick={() => onDelete(item)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <TrashIcon className="w-4 h-4" />
        </button>
    </li>
));

const SnapshotItem = React.memo(({ item, onLoad, onDelete }: { item: SessionSnapshot, onLoad: (i: SessionSnapshot) => void, onDelete: (name: string) => void }) => (
    <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 group">
        <CameraIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="flex-grow">
            <p className="text-gray-300 font-semibold truncate">{item.name}</p>
            <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => onLoad(item)} className="p-1 text-gray-400 hover:text-accent" title="Load Snapshot">
                <DownloadIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(item.name)} className="p-1 text-gray-500 hover:text-red-400" title="Delete Snapshot">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    </li>
));

const ImageItem = React.memo(({ item, onDelete }: { item: StoredImage, onDelete: (id: number) => void }) => (
     <div className="relative group">
        <img src={item.imageUrl} alt={item.prompt} className="w-full h-32 object-cover rounded-lg" />
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
            <p className="text-xs text-white/80 line-clamp-3 mb-2">{item.prompt}</p>
            <button onClick={() => onDelete(item.id)} className="p-2 bg-red-600/50 rounded-full text-white">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
));

const MobilePanel: React.FC<MobilePanelProps> = ({ athenaRef }) => {
    const { 
        activePanel, 
        setActivePanel,
        handleSearch,
        handleLoadSnapshot,
        article,
        isLoading,
        currentTopic,
        state,
        dispatch,
        loadedSnapshotHistory,
    } = useNexus();
    const { t } = useLocalization();
    const panelRef = useRef<HTMLDivElement>(null);
    const onClose = () => setActivePanel(null);

    useEffect(() => {
        if (activePanel) {
            const panelNode = panelRef.current;
            if (!panelNode) return;

            const focusableElements = Array.from(
                panelNode.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter((el: HTMLElement) => el.offsetParent !== null);

            if (focusableElements.length === 0) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            (firstElement as HTMLElement)?.focus();

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

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
            };

            panelNode.addEventListener('keydown', handleKeyDown);
            return () => panelNode.removeEventListener('keydown', handleKeyDown);
        }
    }, [activePanel]);


    const panelTitles: { [key: string]: string } = {
        history: t('panels.history.title'),
        bookmarks: t('panels.bookmarks.title'),
        learningPaths: t('panels.learningPaths.title'),
        snapshots: t('panels.snapshots.title'),
        imageLibrary: t('panels.imageLibrary.title'),
        athena: t('athena.title'),
    };
    
    const renderContent = () => {
        if (!activePanel) return null;
        
        const { history, bookmarks, sessionSnapshots, imageLibrary } = state;

        const renderEmptyState = () => <div className="text-center text-gray-500 p-8">{t('panels.noEntries')}</div>;

        switch (activePanel) {
            case 'history':
                return history.length > 0 ? (
                    <ul className="p-2">{history.map(item => <HistoryItem key={item} item={item} onSelect={handleSearch} onDelete={(topic) => dispatch({ type: 'DELETE_HISTORY_ITEM', payload: topic })} Icon={HistoryIcon} />)}</ul>
                ) : renderEmptyState();
            case 'bookmarks':
                return bookmarks.length > 0 ? (
                    <ul className="p-2">{bookmarks.map(item => <HistoryItem key={item} item={item} onSelect={handleSearch} onDelete={(topic) => dispatch({ type: 'DELETE_BOOKMARK_ITEM', payload: topic })} Icon={BookmarkIcon} />)}</ul>
                ) : renderEmptyState();
            case 'learningPaths':
                return <div className="p-2"><LearningPathsManager handleSearch={handleSearch} closePanel={onClose} /></div>;
            case 'snapshots':
                 return sessionSnapshots.length > 0 ? (
                    <ul className="p-2">{sessionSnapshots.map(item => <SnapshotItem key={item.name} item={item} onLoad={handleLoadSnapshot} onDelete={(name) => dispatch({ type: 'DELETE_SNAPSHOT', payload: name })} />)}</ul>
                ) : renderEmptyState();
            case 'imageLibrary':
                return imageLibrary.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 p-2">{imageLibrary.map(item => <ImageItem key={item.id} item={item} onDelete={(id) => dispatch({ type: 'DELETE_IMAGE', payload: id })} />)}</div>
                ) : renderEmptyState();
            case 'athena':
                 return (
                    <AthenaCopilot 
                        ref={athenaRef}
                        key={article?.title}
                        article={article}
                        isLoading={isLoading}
                        currentTopic={currentTopic}
                        history={history}
                        initialChatHistory={loadedSnapshotHistory}
                    />
                );
            default:
                return null;
        }
    };
    
    const isFullScreen = activePanel === 'athena';

    return (
        <div 
            className={`fixed inset-0 z-40 md:hidden transition-colors duration-300 ${activePanel ? 'bg-black/60' : 'bg-transparent pointer-events-none'}`}
            onClick={onClose}
        >
            <div 
                ref={panelRef}
                className={`absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${activePanel ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ height: isFullScreen ? 'calc(100% - 4rem)' : '75%' }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={activePanel && !isFullScreen ? 'panel-title' : undefined}
                tabIndex={-1}
            >
                {!isFullScreen && activePanel && <PanelHeader title={panelTitles[activePanel]} onClose={onClose} />}
                <div className="flex-grow overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default MobilePanel;