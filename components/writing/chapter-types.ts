export interface CharacterAttributes {
  personality: string[];
  appearance: string[];
  background: string[];
}

export interface CharacterRelationship {
  targetName: string;
  type: string;
  description: string;
}

export interface ChapterCharacter {
  name: string;
  aliases: string[];
  attributes: CharacterAttributes;
  relationships: CharacterRelationship[];
}

export interface ChapterSetting {
  name: string;
  description: string;
  attributes: {
    type: string;
    features: string[];
    significance: string[];
    associatedCharacters: string[];
  };
  characterConnections: {
    characterName: string;
    connection: string;
  }[];
}

export interface ChapterPlotPoint {
  id: string;
  title: string;
  description: string;
  sequence: number;
}

export interface ChapterMetadata {
  storyBeats: string;
  characters: ChapterCharacter[];
  settings: ChapterSetting[];
  plotPoints: ChapterPlotPoint[];
  notes: string;
}

export interface Chapter {
  id: string;
  title: string;
  metadata: ChapterMetadata;
  order: number;
} 