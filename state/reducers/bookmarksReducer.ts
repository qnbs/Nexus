
import { AppAction } from '../appReducer';
import * as dbService from '../../services/dbService';

export type BookmarksState = string[];

export const bookmarksReducer = (state: BookmarksState, action: AppAction): BookmarksState => {
    switch (action.type) {
        case 'TOGGLE_BOOKMARK': {
            const topic = action.payload;
            const isBookmarked = state.includes(topic);
            const newBookmarks = isBookmarked
                ? state.filter(b => b !== topic)
                : [topic, ...state];
            
            if (isBookmarked) {
                dbService.deleteBookmark(topic);
            } else {
                dbService.addBookmark(topic);
            }
            return newBookmarks;
        }
        case 'DELETE_BOOKMARK_ITEM': {
             const newBookmarks = state.filter(b => b !== action.payload);
             dbService.deleteBookmark(action.payload);
             return newBookmarks;
        }
        case 'CLEAR_BOOKMARKS':
            dbService.clearBookmarks();
            return [];
        default:
            return state;
    }
};
