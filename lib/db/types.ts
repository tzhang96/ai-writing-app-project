// Entity Types
export interface Entity {
  id: string;
  name: string;
  type: 'character' | 'setting' | 'plotPoint';
  metadata: {
    description?: string;
    aliases?: string[];
    attributes?: {
      // Character attributes
      personality?: string[];
      appearance?: string[];
      background?: string[];
      // Setting attributes
      type?: string;
      features?: string[];
      significance?: string[];
      // Plot point attributes
      events?: string[];
      impact?: string[];
      connections?: string[];
    };
    relationships?: any[];
  };
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter Types
export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  order: number;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter-Entity Relationship
export interface ChapterEntityConnection {
  id: string;
  chapterId: string;
  entityId: string;
  entityType: 'character' | 'setting' | 'plotPoint';
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter Beat
export interface ChapterBeat {
  id?: string;
  chapterId: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter Note
export interface ChapterNote {
  id?: string;
  chapterId: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter with Relationships (for UI)
export interface ChapterWithRelationships extends Chapter {
  connections: {
    characters: Entity[];
    settings: Entity[];
    plotPoints: Entity[];
  };
  beats?: ChapterBeat[];
  notes?: ChapterNote[];
} 