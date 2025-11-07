import React from 'react';
import { useNexus } from '../context/NexusContext';
import AthenaCopilot from './AthenaCopilot';
import { AthenaCopilotRef } from '../types';

interface RightSidebarProps {
    athenaRef: React.RefObject<AthenaCopilotRef>;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ athenaRef }) => {
    const { 
        article, 
        isLoading, 
        currentTopic, 
        state, 
        loadedSnapshotHistory 
    } = useNexus();

    return (
        <aside className="w-full md:w-96 lg:w-[440px] flex-shrink-0 h-screen border-l border-gray-700/50 hidden md:flex">
            <AthenaCopilot 
                ref={athenaRef}
                key={article?.title} // Force re-mount on new article to reset state
                article={article} 
                isLoading={isLoading} 
                currentTopic={currentTopic} 
                history={state.history} 
                initialChatHistory={loadedSnapshotHistory}
            />
        </aside>
    );
};

export default RightSidebar;
