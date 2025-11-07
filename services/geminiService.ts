

import { GoogleGenAI, Type, GenerateContentResponse, Chat, Modality, GenerateImagesResponse } from "@google/genai";
import { ArticleData, RelatedTopic, ChatMessage, StarterTopic, AppSettings, SummaryType, Locale } from '../types';
import { Prompts } from './prompts';
import { ApiError, RateLimitError, OfflineError, JsonParseError, SafetyError, ApiKeyNotFoundError } from './errors';

const getAi = () => {
    // Creating a new instance each time ensures we use the latest key, 
    // which is important for features like Veo where the key is selected by the user.
    // The SDK will handle throwing an error if the API key is missing.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const callGeminiWithRetry = async <T,>(apiCall: () => Promise<T>, context: string, locale: Locale, maxRetries = 3, initialDelay = 2000): Promise<T> => {
    const errorMessages = {
        de: {
            rateLimit: "Das API-Ratenlimit wurde überschritten. Bitte überprüfen Sie Ihren Plan und Ihre Abrechnungsdetails oder versuchen Sie es später erneut.",
            maxRetries: `[${context}] Maximale Wiederholungsversuche überschritten.`,
            offline: "Sie scheinen offline zu sein. Diese Funktion erfordert eine Internetverbindung."
        },
        en: {
            rateLimit: "The API rate limit has been exceeded. Please check your plan and billing details, or try again later.",
            maxRetries: `[${context}] Max retries exceeded.`,
            offline: "You appear to be offline. This feature requires an internet connection."
        }
    };
    const messages = errorMessages[locale] || errorMessages.en;

    if (!navigator.onLine) {
        throw new OfflineError(messages.offline);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.toString() : String(error);
            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

            if (isRateLimitError) {
                if (attempt === maxRetries - 1) {
                    console.error(`[${context}] Final attempt failed due to rate limiting.`);
                    throw new RateLimitError(messages.rateLimit);
                }
                const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter
                console.warn(`[${context}] Rate limit hit. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`[${context}] Non-retryable error:`, error);
                if (error instanceof ApiError) throw error;
                throw new ApiError(errorMessage);
            }
        }
    }
    throw new ApiError(messages.maxRetries);
};

const timelineEventSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING, description: "The year or date of the event." },
        title: { type: Type.STRING, description: "A short title for the event." },
        description: { type: Type.STRING, description: "A one-sentence description of the event." },
    },
    required: ["date", "title", "description"]
};

const articleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The main title of the article." },
    introduction: { type: Type.STRING, description: "A detailed introductory paragraph." },
    sections: {
      type: Type.ARRAY,
      description: "An array of 3-5 sections, each with a heading, detailed content, and a prompt for an accompanying image.",
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "The heading for this section." },
          content: { type: Type.STRING, description: "The detailed content for this section." },
          imagePrompt: { type: Type.STRING, description: "A detailed, visually descriptive prompt to generate an image that captures the essence of this section's content."}
        },
        required: ["heading", "content", "imagePrompt"]
      }
    },
    conclusion: { type: Type.STRING, description: "A concluding paragraph." },
    timeline: {
        type: Type.ARRAY,
        description: "If the topic is historical or has a clear chronological progression, provide a timeline of 3-5 key events. Otherwise, this should be an empty array.",
        items: timelineEventSchema,
    }
  },
  required: ["title", "introduction", "sections", "conclusion", "timeline"]
};

const relatedTopicsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the related topic." },
            relevance: { type: Type.STRING, description: "A brief explanation of its relevance to the original topic." },
            quickSummary: { type: Type.STRING, description: "A very short, one-sentence summary of this new topic."}
        },
        required: ["name", "relevance", "quickSummary"]
    }
};

const serendipitySchema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING, description: "An interesting, esoteric, and unexpected topic that is loosely or tangentially related to the original topic." },
    },
    required: ["topic"],
};

const simpleResponseSchema = {
  type: Type.OBJECT,
  properties: {
    response: { type: Type.STRING },
  },
  required: ["response"],
}

const suggestedQuestionsSchema = {
    type: Type.ARRAY,
    description: "A list of 3 insightful follow-up questions a curious user might ask about the article.",
    items: { type: Type.STRING }
};

const parseJsonResponse = <T,>(jsonText: string, context: string, locale: Locale): T => {
    try {
        const cleanedJson = jsonText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson) as T;
    } catch (error) {
        const message = locale === 'de' 
            ? `Inhalt für ${context} konnte nicht geparst werden. Die KI-Antwort war kein gültiges JSON.`
            : `Could not parse content for ${context}. The AI response was not valid JSON.`;
        console.error(`Error parsing JSON for ${context}:`, error, "Raw text:", jsonText);
        throw new JsonParseError(message);
    }
}

export const generateArticleContent = async (topic: string, settings: AppSettings, locale: Locale): Promise<ArticleData> => {
  try {
    const prompt = Prompts.generateArticle(locale, topic, settings);
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: articleSchema,
      },
    }), `article content for "${topic}"`, locale);
    return parseJsonResponse<ArticleData>(response.text, "article", locale);
  } catch (error: unknown) {
    console.error(`Error generating article for "${topic}":`, error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("SAFETY")) {
         const safetyMessage = locale === 'de'
            ? `Das Thema "${topic}" hat einen Sicherheitsfilter ausgelöst. Bitte versuchen Sie ein anderes Thema.`
            : `The topic "${topic}" triggered a safety filter. Please try another topic.`;
         throw new SafetyError(safetyMessage);
    }

    if (error instanceof ApiError) throw error;
    
    const defaultMessage = locale === 'de'
        ? `Fehler beim Erstellen des Artikels für "${topic}". Das Thema ist möglicherweise zu breit, zweideutig oder eingeschränkt.`
        : `Failed to create article for "${topic}". The topic may be too broad, ambiguous, or restricted.`;
    throw new ApiError(defaultMessage);
  }
};

export const constructImagePrompt = (prompt: string, settings: AppSettings, locale: Locale): string => {
    return Prompts.constructImage(locale, prompt, settings);
}

export const generateImageForSection = async (prompt: string, settings: AppSettings, locale: Locale): Promise<string> => {
    if (!prompt) return '';
    try {
        const fullPrompt = constructImagePrompt(prompt, settings, locale);
        const response = await callGeminiWithRetry<GenerateImagesResponse>(() => getAi().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        }), `image for prompt "${prompt}"`, locale);
        const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("No image bytes returned from API.");
        }
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch(error: unknown) {
        console.error('Error generating image for prompt "', prompt, '":', error);
        const message = error instanceof Error ? error.message : String(error);

        if (error instanceof ApiError) throw error;
        
        const safetyMessage = locale === 'de' ? 'Die Anweisung hat einen Sicherheitsfilter ausgelöst.' : 'The prompt triggered a safety filter.';
        const complexMessage = locale === 'de' ? 'Der Prompt könnte zu komplex oder eingeschränkt sein.' : 'The prompt may be too complex.';
        const errorMessage = message.includes('SAFETY') ? new SafetyError(safetyMessage) : new ApiError(complexMessage);
        
        const finalMessage = locale === 'de' ? `Bilderzeugung fehlgeschlagen. ${errorMessage.message}` : `Image generation failed. ${errorMessage.message}`;
        throw new ApiError(finalMessage);
    }
}

export const generateVideoForSection = async (
    prompt: string,
    settings: AppSettings,
    locale: Locale,
    onStatusUpdate: (status: string) => void
): Promise<string> => {
    if (!prompt) return '';
    try {
        // Create a new instance right before the call to use the latest selected API key
        const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullPrompt = constructImagePrompt(prompt, settings, locale);
        onStatusUpdate(locale === 'de' ? 'Videogenerierung wird initialisiert...' : 'Initializing video generation...');
        let operation = await videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: fullPrompt,
            config: { 
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        onStatusUpdate(locale === 'de' ? 'Anfrage gesendet. Warten auf Start...' : 'Request sent. Awaiting start...');
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
            
            const metadata = (operation as any).metadata;
            if (metadata?.progressMessage) {
                onStatusUpdate(metadata.progressMessage);
            } else if (metadata?.state) {
                const statusLabel = locale === 'de' ? 'Status' : 'Status';
                onStatusUpdate(`${statusLabel}: ${metadata.state}`);
            } else {
                onStatusUpdate(locale === 'de' ? 'Verarbeitung läuft...' : 'Processing...');
            }
        }
        
        if ((operation as any).error) {
            const errorMessage = (operation as any).error.message || (locale === 'de' ? 'Unbekannter Verarbeitungsfehler.' : 'Unknown processing error.');
            throw new Error(errorMessage);
        }

        onStatusUpdate(locale === 'de' ? 'Video wird heruntergeladen...' : 'Downloading video...');
        
        const generatedVideo = operation.response?.generatedVideos?.[0];
        const downloadLink = generatedVideo?.video?.uri;

        if (!downloadLink) {
            const videoState = (generatedVideo as any)?.video?.state;
            const failureReason = (generatedVideo as any)?.failureReason;
            let errorMessage = locale === 'de' ? 'Kein Video-Download-Link erhalten.' : 'No video download link received.';

            if (videoState === 'STATE_FAILED') {
                 errorMessage = locale === 'de' ? 'Videogenerierung fehlgeschlagen.' : 'Video generation failed.';
                 if (failureReason) {
                     errorMessage += ` ${locale === 'de' ? 'Grund' : 'Reason'}: ${failureReason}`;
                 }
            } else if (operation.response && (!operation.response.generatedVideos || operation.response.generatedVideos.length === 0)) {
                 errorMessage = locale === 'de' ? 'Die API hat keine Videos zurückgegeben. Dies kann an Sicherheitsfiltern oder dem Prompt liegen.' : 'The API returned no videos. This might be due to safety filters or the prompt.';
            }
            
            console.error("Video generation finished but no download link. Full response:", JSON.stringify(operation.response, null, 2));
            throw new Error(errorMessage);
        }


        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(locale === 'de' ? `Fehler beim Abrufen des Videos: ${response.statusText}` : `Failed to fetch video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch(error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error generating video for prompt "', prompt, '":', error);
        if (message.includes("Requested entity was not found.")) {
             throw new ApiKeyNotFoundError("API key not found or invalid.");
        }
        
        if (error instanceof ApiError) throw error;

        const finalMessage = locale === 'de' ? `Videogenerierung fehlgeschlagen: ${message}` : `Video generation failed: ${message}`;
        throw new ApiError(finalMessage);
    }
};

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } | null => {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
};

export const editImage = async (
    base64ImageUrl: string,
    prompt: string,
    locale: Locale
): Promise<string> => {
    try {
        const imageInfo = parseDataUrl(base64ImageUrl);
        if (!imageInfo) {
            throw new Error(locale === 'de' ? 'Ungültiges Bildformat.' : 'Invalid image format.');
        }

        const imagePart = {
            inlineData: {
                data: imageInfo.data,
                mimeType: imageInfo.mimeType,
            },
        };

        const textPart = { text: prompt };

        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }), `edit image for prompt "${prompt}"`, locale);
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType;
                const data = part.inlineData.data;
                const finalMimeType = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
                return `data:${finalMimeType};base64,${data}`;
            }
        }
        
        throw new Error(locale === 'de' ? 'Kein Bild in der KI-Antwort gefunden.' : 'No image found in AI response.');

    } catch(error: unknown) {
        console.error('Error editing image for prompt "', prompt, '":', error);
        const message = error instanceof Error ? error.message : String(error);
        
        if (error instanceof ApiError) throw error;
        
        const safetyMessage = locale === 'de' ? 'Die Anweisung hat einen Sicherheitsfilter ausgelöst.' : 'The prompt triggered a safety filter.';
        const complexMessage = locale === 'de' ? 'Der Prompt könnte zu komplex sein.' : 'The prompt may be too complex.';
        const errorMessage = message.includes('SAFETY') ? new SafetyError(safetyMessage) : new ApiError(complexMessage);

        const finalMessage = locale === 'de' ? `Bildbearbeitung fehlgeschlagen. ${errorMessage.message}` : `Image editing failed. ${errorMessage.message}`;
        throw new ApiError(finalMessage);
    }
};

export const explainOrDefine = async (
    text: string, 
    mode: 'Define' | 'Explain' | 'Visualize', 
    settings: AppSettings,
    locale: Locale
): Promise<string> => {
    if (mode === 'Visualize') {
        const prompt = Prompts.visualizeText(locale, text);
        return generateImageForSection(prompt, settings, locale);
    }

    const prompt = mode === 'Define' 
        ? Prompts.defineText(locale, text) 
        : Prompts.explainText(locale, text);
        
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: simpleResponseSchema,
            }
        }), `interaction (${mode}) for "${text}"`, locale);
        const result = parseJsonResponse<{ response: string }>(response.text, `interaction (${mode})`, locale);
        return result.response;
    } catch (error: unknown) {
        console.error(`Error during ${mode} for "${text}":`, error);
        if (error instanceof ApiError) throw error;

        const defaultMessage = locale === 'de' ? `Konnte Aktion nicht ausführen: ${mode}` : `Could not perform action: ${mode}`;
        throw new ApiError(defaultMessage);
    }
};

export const getRelatedTopics = async (topic: string, settings: AppSettings, locale: Locale): Promise<RelatedTopic[]> => {
    try {
        const prompt = Prompts.getRelatedTopics(locale, topic, settings);
        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: relatedTopicsSchema,
            },
        }), `related topics for "${topic}"`, locale);
        return parseJsonResponse<RelatedTopic[]>(response.text, "related topics", locale);
    } catch (error: unknown) {
        console.error("Error generating related topics:", error);
        if (error instanceof ApiError) throw error;

        const defaultMessage = locale === 'de' ? "Fehler beim Generieren verwandter Themen." : "Failed to generate related topics.";
        throw new ApiError(defaultMessage);
    }
};

export const getSerendipitousTopic = async (currentTopic: string, locale: Locale): Promise<string> => {
     try {
        const prompt = Prompts.getSerendipitousTopic(locale, currentTopic);
        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: serendipitySchema,
            },
        }), `serendipity topic for "${currentTopic}"`, locale);
        const result = parseJsonResponse<{topic: string}>(response.text, "serendipity topic", locale);
        return result.topic;
    } catch (error: unknown) {
        console.error("Error generating serendipitous topic:", error);
        if (error instanceof ApiError) throw error;

        const defaultMessage = locale === 'de' ? "Fehler beim Generieren eines Kosmischer Sprung-Themas." : "Failed to generate a Cosmic Leap topic.";
        throw new ApiError(defaultMessage);
    }
}

export const getStarterTopics = (t: (key: string, params?: { [key: string]: string | number | undefined }) => any): { [key: string]: StarterTopic[] } => {
    const topics = t('starterTopics');
    if (typeof topics === 'object' && topics !== null && !Array.isArray(topics)) {
        return topics;
    }
    return {};
};


export const generateSummary = async (articleText: string, type: SummaryType, locale: Locale): Promise<string> => {
    const prompt = Prompts.generateSummary(locale, type, articleText);
    try {
        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: simpleResponseSchema,
            }
        }), `summary (${type})`, locale);
        const result = parseJsonResponse<{ response: string }>(response.text, `summary (${type})`, locale);
        return result.response;
    } catch (error: unknown) {
        console.error(`Error generating summary type ${type}:`, error);
        if (error instanceof ApiError) throw error;
        
        const defaultMessage = locale === 'de' ? `Zusammenfassung konnte nicht generiert werden: ${type}` : `Could not generate summary: ${type}`;
        throw new ApiError(defaultMessage);
    }
};

export const getSuggestedQuestions = async (articleText: string, locale: Locale, t: (key: string, params?: { [key: string]: string | number | undefined }) => any): Promise<string[]> => {
    try {
        const prompt = Prompts.getSuggestedQuestions(locale, articleText);
        const response = await callGeminiWithRetry<GenerateContentResponse>(() => getAi().models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestedQuestionsSchema,
            },
        }), "suggested questions", locale);
        return parseJsonResponse<string[]>(response.text, "suggested questions", locale);
    } catch (error) {
        console.error("Error generating suggested questions:", error);
        const fallback = t('athena.fallbackQuestions');
        if (Array.isArray(fallback)) {
            return fallback;
        }
        return [];
    }
};

export const startChat = (
    articleContext: string, 
    locale: Locale, 
    t: (key: string, params?: { [key: string]: string | number | undefined }) => any,
    previousArticlesContext: string = ''
): Chat => {
    const systemInstruction = t('athena.systemInstruction', { articleContext, previousArticlesContext });

    return getAi().chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
};