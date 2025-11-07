import React from 'react';
import { useNexus } from '../context/NexusContext';
import { useLocalization } from '../context/LocalizationContext';
import SearchBar from './SearchBar';
import Logo from './Logo';
import { CommandIcon, CogIcon, QuestionMarkCircleIcon } from './IconComponents';

const Header: React.FC = () => {
    const { 
        handleGoHome,
        handleSearch, 
        handleSerendipity, 
        isLoading, 
        togglePanel,
    } = useNexus();
    const { t } = useLocalization();

    return (
        <header className="p-4 flex-shrink-0 w-full max-w-5xl mx-auto z-10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleGoHome} 
                    className="group focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
                    aria-label="Go to home screen"
                >
                    <Logo className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                </button>
                <div className="flex-grow">
                    <SearchBar onSearch={handleSearch} onSerendipity={handleSerendipity} isLoading={isLoading} />
                </div>
                <div className="hidden md:flex items-center gap-2">
                     <button onClick={() => togglePanel('commandPalette')} title={t('commandPalette.open')} className="p-2.5 rounded-full hover:bg-gray-700 transition-colors"><CommandIcon className="w-5 h-5" /></button>
                     <button onClick={() => togglePanel('settings')} title={t('panels.settings.title')} className="p-2.5 rounded-full hover:bg-gray-700 transition-colors"><CogIcon className="w-5 h-5" /></button>
                     <button onClick={() => togglePanel('help')} title={t('panels.help.title')} className="p-2.5 rounded-full hover:bg-gray-700 transition-colors"><QuestionMarkCircleIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </header>
    );
};

export default Header;
