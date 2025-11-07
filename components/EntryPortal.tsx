import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { SearchIcon, WandIcon, LightbulbIcon, LinkIcon } from './IconComponents';
import Logo from './Logo';

interface EntryPortalProps {
    onStart: () => void;
}

const TutorialStep: React.FC<{ icon: React.FC<{ className?: string }>, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg">
        <div className="flex items-center gap-4">
            <div className="bg-accent/20 p-3 rounded-full">
                <Icon className="w-6 h-6 text-accent" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-100">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    </div>
);


const EntryPortal: React.FC<EntryPortalProps> = ({ onStart }) => {
    const { t, locale, setLocale } = useLocalization();
    const entryData = t('entry');

    if (!entryData || !entryData.tutorial) {
        // Fallback for when localization data isn't ready
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                <Logo className="w-24 h-24 mb-4" />
                <h1 className="text-5xl font-bold">Welcome to Nexus</h1>
                <button onClick={onStart} className="mt-8 bg-sky-500 text-white font-bold py-3 px-8 rounded-full text-lg">
                    Start Exploring
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 sm:p-8 font-modern">
            <header className="w-full max-w-4xl mx-auto flex justify-center">
                <Logo className="w-16 h-16" />
            </header>
            <main className="w-full max-w-4xl mx-auto text-center flex-grow flex flex-col justify-center">
                <p className="text-lg md:text-xl text-gray-400 mb-12">{entryData.subtitle}</p>

                <div className="mb-8">
                    <div className="flex justify-center items-center gap-4">
                        <button
                            onClick={() => setLocale('de')}
                            className={`px-6 py-2 border-2 rounded-full font-semibold transition-colors ${
                                locale === 'de'
                                ? 'border-accent bg-accent/20 text-accent'
                                : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'
                            }`}
                        >
                            Deutsch
                        </button>
                        <button
                            onClick={() => setLocale('en')}
                            className={`px-6 py-2 border-2 rounded-full font-semibold transition-colors ${
                                locale === 'en'
                                ? 'border-accent bg-accent/20 text-accent'
                                : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'
                            }`}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div className="mb-12">
                     <button
                        onClick={onStart}
                        className="bg-accent text-accent-contrast font-bold py-3 px-8 rounded-full text-lg hover:bg-accent-hover transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-accent/20"
                    >
                        {entryData.startExploring}
                    </button>
                </div>

                <div className="text-left space-y-8">
                    <h2 className="text-3xl font-bold text-center mb-6">{entryData.tutorial.title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TutorialStep
                            icon={SearchIcon}
                            title={entryData.tutorial.step1.title}
                            description={entryData.tutorial.step1.description}
                        />
                        <TutorialStep
                            icon={WandIcon}
                            title={entryData.tutorial.step2.title}
                            description={entryData.tutorial.step2.description}
                        />
                        <TutorialStep
                            icon={LightbulbIcon}
                            title={entryData.tutorial.step3.title}
                            description={entryData.tutorial.step3.description}
                        />
                        <TutorialStep
                            icon={LinkIcon}
                            title={entryData.tutorial.step4.title}
                            description={entryData.tutorial.step4.description}
                        />
                    </div>
                </div>
            </main>
             <footer className="mt-12 text-center text-gray-500 text-sm">
                <p>Powered by Google Gemini</p>
            </footer>
        </div>
    );
};

export default EntryPortal;
