import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

// Types for note processing
export interface ProcessNoteRequest {
  content: string;
}

interface CharacterAttributes {
  personality: string[];
  appearance: string[];
  background: string[];
}

interface CharacterRelationship {
  targetName: string;
  type: string;
  description: string;
}

interface Character {
  name: string;
  aliases: string[];
  attributes: CharacterAttributes;
  relationships: CharacterRelationship[];
}

interface LocationAttributes {
  type: string;
  features: string[];
  significance: string[];
  associatedCharacters: string[];
}

interface LocationCharacterConnection {
  characterName: string;
  connection: string;
}

interface Location {
  name: string;
  description: string;
  attributes: LocationAttributes;
  characterConnections: LocationCharacterConnection[];
}

interface EventCharacter {
  name: string;
  role: string;
}

interface EventTiming {
  period: string;
  duration: string;
}

interface Event {
  name: string;
  description: string;
  involvedCharacters: EventCharacter[];
  locations: string[];
  timing: EventTiming;
  significance: string;
}

interface Relationships {
  characters: string[];
  locations: string[];
  events: string[];
}

export interface ProcessNoteResponse {
  category: string;
  confidence: number;
  tags: string[];
  relationships: Relationships;
  extractedEntities: {
    characters: Character[];
    locations: Location[];
    events: Event[];
  };
}

// AI function types
export interface AIAnalysisRequest {
  text: string;
  projectId: string;
}

export interface AIAnalysisResponse {
  analysis: {
    summary: string;
    themes: string[];
    characters: {
      name: string;
      role: string;
      description: string;
    }[];
    plotPoints: {
      title: string;
      description: string;
      sequence: number;
    }[];
    suggestions: string[];
  };
}

export interface AIGenerateRequest {
  prompt: string;
  context?: string;
  projectId: string;
}

export interface AIGenerateResponse {
  text: string;
  suggestions: string[];
}

export interface AIGenerateContentRequest {
  type: 'note' | 'beat' | 'text';
  chapterId: string;
  currentContent?: string;
  projectId: string;
}

export interface AIGenerateContentResponse {
  generatedContent: string;
}

// Cloud Functions
export const processNote = httpsCallable<ProcessNoteRequest, ProcessNoteResponse>(
  functions,
  'processNote'
);

export const analyzeText = httpsCallable<AIAnalysisRequest, AIAnalysisResponse>(
  functions,
  'analyzeText'
);

export const generateText = httpsCallable<AIGenerateRequest, AIGenerateResponse>(
  functions,
  'generateText'
);

export const generateAIContent = httpsCallable<AIGenerateContentRequest, AIGenerateContentResponse>(
  functions,
  'generateAIContent'
);

// Optional: Add the clear database function if needed
export const clearDatabase = httpsCallable(functions, 'clearDatabase'); 