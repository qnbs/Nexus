import React, { createContext, useContext, ReactNode } from 'react';
import { ArticleContextType } from '../types';

export const ArticleContext = createContext<ArticleContextType | null>(null);

export const useArticle = (): ArticleContextType => {
    const context = useContext(ArticleContext);
    if (!context) {
        throw new Error('useArticle must be used within an ArticleProvider');
    }
    return context;
};

export const ArticleProvider: React.FC<{ children: ReactNode; value: ArticleContextType }> = ({ children, value }) => {
    return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
};
