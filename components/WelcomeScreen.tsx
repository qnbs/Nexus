import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useNexus } from '../context/NexusContext';
import * as geminiService from '../services/geminiService';
import { StarterTopic } from '../types';
import LoadingSpinner from './LoadingSpinner';

const MemoizedTopicButton = React.memo(({ topic, onSearch }: { topic: StarterTopic, onSearch: (title: string) => void }) => {
    if (!topic || typeof topic.title !== 'string' || typeof topic.description !== 'string') return null;
    return (
        <button
            onClick={() => onSearch(topic.title)}
            className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-left hover:bg-gray-800 hover:border-accent transition-colors"
        >
            <h4 className="font-bold text-gray-100">{topic.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{topic.description}</p>
        </button>
    );
});

const MemoizedCategorySection = React.memo(({ category, topics, onSearch }: { category: string, topics: StarterTopic[], onSearch: (title: string) => void }) => {
    if (!Array.isArray(topics)) return null;
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3">{category}</h3>
            <div className="space-y-4">
                {topics.map((topic, index) => (
                    <MemoizedTopicButton key={topic.title + index} topic={topic} onSearch={onSearch} />
                ))}
            </div>
        </div>
    );
});

const WelcomeScreen: React.FC = () => {
    const { handleSearch } = useNexus();
    const { t } = useLocalization();
    const starterTopicCategories = geminiService.getStarterTopics(t);

    if (!starterTopicCategories || typeof starterTopicCategories !== 'object' || Array.isArray(starterTopicCategories) || Object.keys(starterTopicCategories).length === 0) {
        return (
             <div className="text-center p-4 md:p-8">
                <h1 className="text-4xl font-bold text-accent mb-2">{t('welcome.title')}</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t('welcome.subtitle')}</p>
                <div className="mt-12"><LoadingSpinner /></div>
             </div>
        )
    }

    return (
        <div className="text-center p-4 md:p-8">
            <h1 className="text-4xl font-bold text-accent mb-2">{t('welcome.title')}</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t('welcome.subtitle')}</p>
            <div className="mt-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(starterTopicCategories).map(([category, topics]) => (
                    <MemoizedCategorySection 
                        key={category} 
                        category={category} 
                        topics={topics} 
                        onSearch={handleSearch} 
                    />
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;