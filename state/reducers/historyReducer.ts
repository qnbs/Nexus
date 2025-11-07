
import { AppAction } from '../appReducer';
import * as dbService from '../../services/dbService';

export type HistoryState = string[];

export const historyReducer = (state: HistoryState, action: AppAction): HistoryState => {
    switch (action.type) {
        case 'ADD_HISTORY': {
            const newHistory = [action.payload, ...state.filter(t => t !== action.payload)].slice(0, 100);
            dbService.addHistoryItem(action.payload);
            return newHistory;
        }
        case 'DELETE_HISTORY_ITEM': {
            const newHistory = state.filter(h => h !== action.payload);
            dbService.deleteHistoryItem(action.payload);
            return newHistory;
        }
        case 'CLEAR_HISTORY':
            dbService.clearHistory();
            return [];
        default:
            return state;
    }
};
