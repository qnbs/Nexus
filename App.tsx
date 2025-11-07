import React from 'react';
import MainLayout from './components/MainLayout';
import { AppSettings, Language, AccentColor, FontFamily, TextSize, ArticleLength, ImageStyle } from './types';

// FIX: Moved DEFAULT_SETTINGS here to be shared across the app, fixing an import error.
export const DEFAULT_SETTINGS: AppSettings = {
    language: Language.English,
    accentColor: AccentColor.Sky,
    fontFamily: FontFamily.Modern,
    textSize: TextSize.Standard,
    articleLength: ArticleLength.Standard,
    imageStyle: ImageStyle.Photorealistic,
    autoLoadImages: false,
    synapseDensity: 5,
    hasOnboarded: false
};

const App: React.FC = () => {
    return <MainLayout />;
};

export default App;