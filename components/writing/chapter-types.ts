export interface ChapterMetadata {
  storyBeats: string;
  characters: string[];
  settings: string[];
  plotPoints: string[];
  notes: string;
}

export interface Chapter {
  id: string;
  title: string;
  metadata: ChapterMetadata;
  order: number;
} 