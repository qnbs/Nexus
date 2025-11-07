
import { LearningPath, SessionSnapshot, StoredImage } from '../types';
import { bookmarksReducer } from './reducers/bookmarksReducer';
import { historyReducer } from './reducers/historyReducer';
import { imageLibraryReducer } from './reducers/imageLibraryReducer';
import { learningPathsReducer } from './reducers/learningPathsReducer';
import { snapshotsReducer } from './reducers/snapshotsReducer';


export interface AppState {
    history: string[];
    bookmarks: string[];
    learningPaths: LearningPath[];
    sessionSnapshots: SessionSnapshot[];
    imageLibrary: StoredImage[];
}

export type AppAction =
  | { type: 'SET_ALL_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_HISTORY'; payload: string }
  | { type: 'DELETE_HISTORY_ITEM'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'TOGGLE_BOOKMARK'; payload: string }
  | { type: 'DELETE_BOOKMARK_ITEM'; payload: string }
  | { type: 'CLEAR_BOOKMARKS' }
  | { type: 'CREATE_PATH'; payload: string }
  | { type: 'ADD_TO_PATH'; payload: { pathName: string; articleTitle: string } }
  | { type: 'DELETE_PATH'; payload: string }
  | { type: 'REMOVE_ARTICLE_FROM_PATH'; payload: { pathName: string; articleTitle: string } }
  | { type: 'TOGGLE_ARTICLE_COMPLETION'; payload: { pathName: string; articleTitle: string } }
  | { type: 'REORDER_ARTICLES'; payload: { pathName: string; startIndex: number; endIndex: number } }
  | { type: 'CLEAR_PATHS' }
  | { type: 'SAVE_SNAPSHOT'; payload: SessionSnapshot }
  | { type: 'DELETE_SNAPSHOT'; payload: string }
  | { type: 'CLEAR_SNAPSHOTS' }
  | { type: 'ADD_IMAGE'; payload: StoredImage }
  | { type: 'DELETE_IMAGE'; payload: number }
  | { type: 'CLEAR_IMAGES' };


export const initialState: AppState = {
    history: [],
    bookmarks: [],
    learningPaths: [],
    sessionSnapshots: [],
    imageLibrary: [],
};

// Root Reducer
export function appReducer(state: AppState, action: AppAction): AppState {
    if (action.type === 'SET_ALL_DATA') {
        return { ...state, ...action.payload };
    }
    
    const newState: AppState = {
        history: historyReducer(state.history, action),
        bookmarks: bookmarksReducer(state.bookmarks, action),
        learningPaths: learningPathsReducer(state.learningPaths, action),
        sessionSnapshots: snapshotsReducer(state.sessionSnapshots, action),
        imageLibrary: imageLibraryReducer(state.imageLibrary, action),
    };

    return newState;
}
