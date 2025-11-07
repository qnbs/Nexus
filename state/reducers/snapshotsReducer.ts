
import { SessionSnapshot } from '../../types';
import { AppAction } from '../appReducer';
import * as dbService from '../../services/dbService';

export type SnapshotsState = SessionSnapshot[];

export const snapshotsReducer = (state: SnapshotsState, action: AppAction): SnapshotsState => {
    switch (action.type) {
        case 'SAVE_SNAPSHOT': {
            const newSnapshots = [action.payload, ...state.filter(s => s.name !== action.payload.name)];
            dbService.saveSessionSnapshots(newSnapshots);
            return newSnapshots;
        }
        case 'DELETE_SNAPSHOT': {
            const newSnapshots = state.filter(s => s.name !== action.payload);
            dbService.deleteSessionSnapshot(action.payload);
            return newSnapshots;
        }
        case 'CLEAR_SNAPSHOTS':
            dbService.clearSessionSnapshots();
            return [];
        default:
            return state;
    }
};
