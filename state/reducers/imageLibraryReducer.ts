
import { StoredImage } from '../../types';
import { AppAction } from '../appReducer';
import * as dbService from '../../services/dbService';

export type ImageLibraryState = StoredImage[];

export const imageLibraryReducer = (state: ImageLibraryState, action: AppAction): ImageLibraryState => {
    switch (action.type) {
        case 'ADD_IMAGE': {
            const newLibrary = [action.payload, ...state];
            dbService.addImage(action.payload);
            return newLibrary;
        }
        case 'DELETE_IMAGE': {
            const newLibrary = state.filter(img => img.id !== action.payload);
            dbService.deleteImage(action.payload);
            return newLibrary;
        }
        case 'CLEAR_IMAGES':
            dbService.clearImages();
            return [];
        default:
            return state;
    }
};
