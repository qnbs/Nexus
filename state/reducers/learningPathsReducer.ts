
import { LearningPath } from '../../types';
import { AppAction } from '../appReducer';
import * as dbService from '../../services/dbService';

export type LearningPathsState = LearningPath[];

export const learningPathsReducer = (state: LearningPathsState, action: AppAction): LearningPathsState => {
    switch (action.type) {
        case 'CREATE_PATH': {
            if (state.some(p => p.name === action.payload)) return state;
            const newPath: LearningPath = { name: action.payload, articles: [] };
            const newPaths = [...state, newPath];
            dbService.saveLearningPaths(newPaths);
            return newPaths;
        }
        case 'ADD_TO_PATH': {
            const { pathName, articleTitle } = action.payload;
            const newPaths = state.map(p => {
                if (p.name === pathName && !p.articles.some(a => a.title === articleTitle)) {
                    return { ...p, articles: [...p.articles, { title: articleTitle, completed: false }] };
                }
                return p;
            });
            dbService.saveLearningPaths(newPaths);
            return newPaths;
        }
        case 'DELETE_PATH': {
            const newPaths = state.filter(p => p.name !== action.payload);
            dbService.deleteLearningPath(action.payload);
            return newPaths;
        }
        case 'REMOVE_ARTICLE_FROM_PATH': {
             const { pathName, articleTitle } = action.payload;
             const newPaths = state.map(p => {
                if (p.name === pathName) {
                    return { ...p, articles: p.articles.filter(a => a.title !== articleTitle) };
                }
                return p;
            });
            dbService.saveLearningPaths(newPaths);
            return newPaths;
        }
        case 'TOGGLE_ARTICLE_COMPLETION': {
            const { pathName, articleTitle } = action.payload;
            const newPaths = state.map(p => {
                if (p.name === pathName) {
                    const newArticles = p.articles.map(a => 
                        a.title === articleTitle ? { ...a, completed: !a.completed } : a
                    );
                    return { ...p, articles: newArticles };
                }
                return p;
            });
            dbService.saveLearningPaths(newPaths);
            return newPaths;
        }
        case 'REORDER_ARTICLES': {
            const { pathName, startIndex, endIndex } = action.payload;
            const pathIndex = state.findIndex(p => p.name === pathName);
            if (pathIndex === -1) return state;

            const newPaths = [...state];
            const path = newPaths[pathIndex];
            const newArticles = Array.from(path.articles);
            const [removed] = newArticles.splice(startIndex, 1);
            newArticles.splice(endIndex, 0, removed);
            
            newPaths[pathIndex] = { ...path, articles: newArticles };
            dbService.saveLearningPaths(newPaths);
            return newPaths;
        }
        case 'CLEAR_PATHS':
            dbService.clearLearningPaths();
            return [];
        default:
            return state;
    }
};
