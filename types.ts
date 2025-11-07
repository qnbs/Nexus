

import type { Chat } from '@google/genai';
import type { Dispatch, SetStateAction, RefObject, ChangeEvent } from 'react';
import { AppState, AppAction } from './state/appReducer';

export enum SummaryType {
  TLDR = "tldr",
  ELI5 = "eli5",
  KEY_POINTS = "keyPoints",
  ANALOGY = "analogy",
}

export interface TimelineEvent {
    date: string;
    title: string;
    description: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface ArticleData {
  title: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion:string;
  timeline?: TimelineEvent[];
}

export interface RelatedTopic {
  name: string;
  relevance: string;
  quickSummary: string;
}

export type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export type StarterTopic = {
    title: string;
    description: string;
};

// User Data & Management Types
export interface StoredImage {
  id: number;
  imageUrl: string;
  prompt: string;
  topic: string;
  timestamp: number;
}

export interface ArticleInPath {
  title: string;
  completed: boolean;
}

export interface LearningPath {
  name: string;
  articles: ArticleInPath[];
}

export interface SessionSnapshot {
  name: string;
  timestamp: number;
  topic: string;
  article: ArticleData;
  relatedTopics: RelatedTopic[];
  chatHistory: ChatMessage[];
}

export interface NexusBackupData {
  settings: AppSettings;
  history: string[];
  bookmarks: string[];
  learningPaths: LearningPath[];
  sessionSnapshots: SessionSnapshot[];
  imageLibrary?: StoredImage[];
}

// Settings Types
export enum Language {
    German = 'de',
    English = 'en',
}

export enum AccentColor {
    Amber = 'amber',
    Sky = 'sky',
    Rose = 'rose',
    Emerald = 'emerald',
}

export enum FontFamily {
    Artistic = 'artistic',
    Modern = 'modern',
}

export enum ArticleLength {
    Concise = 'concise',
    Standard = 'standard',
    InDepth = 'in-depth',
}

export enum ImageStyle {
    Photorealistic = 'photorealistic',
    Artistic = 'artistic',
    Vintage = 'vintage',
    Minimalist = 'minimalist',
}

export enum TextSize {
    Small = 'sm',
    Standard = 'base',
    Large = 'lg',
}

export interface AppSettings {
    language: Language;
    accentColor: AccentColor;
    fontFamily: FontFamily;
    textSize: TextSize;
    articleLength: ArticleLength;
    imageStyle: ImageStyle;
    autoLoadImages: boolean;
    synapseDensity: number;
    hasOnboarded?: boolean;
}

// PWA Install Prompt Event Type
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}


// Context Types
export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export type Locale = 'en' | 'de';

export interface LocalizationContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: { [key: string]: string | number | undefined }) => any;
    isLoading: boolean;
}

export interface ArticleContextType {
    article: ArticleData;
    setArticle: Dispatch<SetStateAction<ArticleData | null>>;
    isBookmarked: boolean;
    settings: AppSettings;
    currentTopic: string;
    onToggleBookmark: () => void;
    onGenerateImage: (sectionIndex: number) => Promise<void>;
    onGenerateAllImages: () => void;
    onGenerateVideo: (sectionIndex: number, onStatusUpdate: (status: string) => void) => Promise<void>;
    addImageToLibrary: (imageData: { imageUrl: string; prompt: string; topic: string; }) => void;
}

// Component Prop Types
export type ActivePanel = 'history' | 'bookmarks' | 'learningPaths' | 'snapshots' | 'imageLibrary' | 'athena' | 'settings' | 'help' | 'commandPalette' | null;

export interface MobilePanelProps {
    athenaRef: RefObject<AthenaCopilotRef>;
}

export interface BottomNavBarProps {
    togglePanel: (panel: ActivePanel) => void;
}

export interface AthenaCopilotRef {
    getChatHistory: () => ChatMessage[];
}