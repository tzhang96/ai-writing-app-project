"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users,
  Map,
  LayoutDashboard,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  ChevronUp,
  MoreVertical,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChapterMetadata, Chapter, ChapterCharacter, ChapterSetting, ChapterPlotPoint } from './chapter-types';
import { AiEnhancedTextarea } from "@/components/ui/ai-enhanced-textarea";
import { MetadataCard, MetadataItem, AddItemButton } from './metadata-card';

export interface ChapterDetailProps {
  chapter: Chapter;
  onGoBack: () => void;
  onChapterUpdate: (chapter: Chapter) => void;
  aiScribeEnabled?: boolean;
}

export function ChapterDetail({ chapter, onGoBack, onChapterUpdate, aiScribeEnabled = true }: ChapterDetailProps) {
  // State for expanded cards
  const [expandedCards, setExpandedCards] = useState({
    storyBeats: true,
    characters: true,
    settings: true,
    plotPoints: true,
    notes: true
  });

  // Toggle card expanded state
  const toggleCard = (cardName: string) => {
    setExpandedCards({
      ...expandedCards,
      [cardName]: !expandedCards[cardName as keyof typeof expandedCards]
    });
  };
  
  // Helper functions for updating chapter metadata
  const updateMetadata = (field: keyof ChapterMetadata, value: any) => {
    const updatedChapter = {
      ...chapter,
      metadata: {
        ...chapter.metadata,
        [field]: value
      }
    };
    onChapterUpdate(updatedChapter);
  };

  // Add a new character
  const addCharacter = (name: string) => {
    if (!name.trim()) return;
    
    const newCharacter: ChapterCharacter = {
      name: name.trim(),
      aliases: [],
      attributes: {
        personality: [],
        appearance: [],
        background: []
      },
      relationships: []
    };
    
    const updatedCharacters = [...(chapter.metadata.characters || []), newCharacter];
    updateMetadata('characters', updatedCharacters);
  };

  // Add a new setting
  const addSetting = (name: string) => {
    if (!name.trim()) return;
    
    const newSetting: ChapterSetting = {
      name: name.trim(),
      description: '',
      attributes: {
        type: '',
        features: [],
        significance: [],
        associatedCharacters: []
      },
      characterConnections: []
    };
    
    const updatedSettings = [...(chapter.metadata.settings || []), newSetting];
    updateMetadata('settings', updatedSettings);
  };

  // Add a new plot point
  const addPlotPoint = (title: string) => {
    if (!title.trim()) return;
    
    const newPlotPoint: ChapterPlotPoint = {
      id: `plot-${Date.now()}`,
      title: title.trim(),
      description: '',
      sequence: (chapter.metadata.plotPoints || []).length
    };
    
    const updatedPlotPoints = [...(chapter.metadata.plotPoints || []), newPlotPoint];
    updateMetadata('plotPoints', updatedPlotPoints);
  };

  // Move a plot point up in sequence
  const movePlotPointUp = (id: string) => {
    const plotPoints = [...(chapter.metadata.plotPoints || [])];
    const index = plotPoints.findIndex(pp => pp.id === id);
    
    if (index <= 0) return;
    
    // Swap with previous item
    const temp = plotPoints[index - 1];
    plotPoints[index - 1] = { ...plotPoints[index], sequence: index - 1 };
    plotPoints[index] = { ...temp, sequence: index };
    
    updateMetadata('plotPoints', plotPoints);
  };

  // Move a plot point down in sequence
  const movePlotPointDown = (id: string) => {
    const plotPoints = [...(chapter.metadata.plotPoints || [])];
    const index = plotPoints.findIndex(pp => pp.id === id);
    
    if (index < 0 || index >= plotPoints.length - 1) return;
    
    // Swap with next item
    const temp = plotPoints[index + 1];
    plotPoints[index + 1] = { ...plotPoints[index], sequence: index + 1 };
    plotPoints[index] = { ...temp, sequence: index };
    
    updateMetadata('plotPoints', plotPoints);
  };

  // Update a plot point field
  const updatePlotPoint = (id: string, field: keyof ChapterPlotPoint, value: string) => {
    const plotPoints = [...(chapter.metadata.plotPoints || [])];
    const index = plotPoints.findIndex(pp => pp.id === id);
    
    if (index < 0) return;
    
    plotPoints[index] = {
      ...plotPoints[index],
      [field]: value
    };
    
    updateMetadata('plotPoints', plotPoints);
  };

  // Delete a plot point
  const deletePlotPoint = (id: string) => {
    const plotPoints = [...(chapter.metadata.plotPoints || [])];
    const index = plotPoints.findIndex(pp => pp.id === id);
    
    if (index < 0) return;
    
    plotPoints.splice(index, 1);
    
    // Update sequence numbers
    const updatedPlotPoints = plotPoints.map((pp, idx) => ({
      ...pp,
      sequence: idx
    }));
    
    updateMetadata('plotPoints', updatedPlotPoints);
  };

  // Remove an item from a metadata array
  const removeMetadataItem = (field: 'characters' | 'settings' | 'plotPoints', index: number) => {
    const currentArray = chapter.metadata[field] || [];
    const updatedArray = [...currentArray];
    updatedArray.splice(index, 1);
    updateMetadata(field, updatedArray);
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Plot Points Card - Using the reusable components */}
      <MetadataCard
        title="Plot Points"
        icon={<BookOpen className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.plotPoints}
        onToggle={() => toggleCard('plotPoints')}
      >
        <div className="space-y-3">
          {(chapter.metadata.plotPoints || [])
            .sort((a, b) => a.sequence - b.sequence)
            .map((plotPoint) => (
              <MetadataItem
                key={plotPoint.id}
                title={
                  <Input
                    value={plotPoint.title}
                    onChange={(e) => updatePlotPoint(plotPoint.id, 'title', e.target.value)}
                    className="border-0 bg-transparent px-0 text-base font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Plot point title"
                  />
                }
                onRemove={() => {
                  // Remove from list but don't delete
                  const updatedPlotPoints = [...chapter.metadata.plotPoints].filter(
                    pp => pp.id !== plotPoint.id
                  );
                  updateMetadata('plotPoints', updatedPlotPoints);
                }}
              >
                <AiEnhancedTextarea
                  value={plotPoint.description}
                  onChange={(e) => updatePlotPoint(plotPoint.id, 'description', e.target.value)}
                  placeholder="Describe this plot point..."
                  className="min-h-[80px] border-0 bg-transparent focus-visible:ring-0 resize-none"
                  aiScribeEnabled={aiScribeEnabled}
                />
              </MetadataItem>
            ))}
        </div>
        
        <AddItemButton
          label="Add Plot Point"
          onClick={() => {
            const title = prompt("Enter plot point title:");
            if (title && title.trim()) {
              addPlotPoint(title);
            }
          }}
        />
      </MetadataCard>

      {/* Story Beats Card */}
      <MetadataCard
        title="Story Beats"
        icon={<LayoutDashboard className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.storyBeats}
        onToggle={() => toggleCard('storyBeats')}
      >
        <AiEnhancedTextarea 
          value={chapter.metadata.storyBeats} 
          onChange={(e) => updateMetadata('storyBeats', e.target.value)}
          placeholder="Enter the key story beats for this chapter..."
          className="min-h-[200px] w-full"
          aiScribeEnabled={aiScribeEnabled}
        />
      </MetadataCard>

      {/* Notes Card */}
      <MetadataCard
        title="Notes"
        icon={<FileText className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.notes}
        onToggle={() => toggleCard('notes')}
      >
        <AiEnhancedTextarea 
          value={chapter.metadata.notes} 
          onChange={(e) => updateMetadata('notes', e.target.value)}
          placeholder="Additional notes for this chapter..."
          className="min-h-24"
          aiScribeEnabled={aiScribeEnabled}
        />
      </MetadataCard>
      
      {/* Characters Card */}
      <MetadataCard
        title="Characters"
        icon={<Users className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.characters}
        onToggle={() => toggleCard('characters')}
      >
        <div className="grid grid-cols-1 gap-4">
          {chapter.metadata.characters.map((character, index) => (
            <Card key={`character-${index}`} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{character.name}</h4>
                  {character.aliases.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Also known as: {character.aliases.join(', ')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const updatedCharacters = [...chapter.metadata.characters];
                    updatedCharacters.splice(index, 1);
                    updateMetadata('characters', updatedCharacters);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Personality</h5>
                  <div className="flex flex-wrap gap-2">
                    {character.attributes.personality?.map((trait, i) => (
                      <Badge key={i} variant="secondary">{trait}</Badge>
                    )) || <span className="text-sm text-muted-foreground">No personality traits added</span>}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Appearance</h5>
                  <div className="flex flex-wrap gap-2">
                    {character.attributes.appearance?.map((trait, i) => (
                      <Badge key={i} variant="secondary">{trait}</Badge>
                    )) || <span className="text-sm text-muted-foreground">No appearance details added</span>}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Background</h5>
                  <div className="flex flex-wrap gap-2">
                    {character.attributes.background?.map((detail, i) => (
                      <Badge key={i} variant="secondary">{detail}</Badge>
                    )) || <span className="text-sm text-muted-foreground">No background details added</span>}
                  </div>
                </div>
                
                {character.relationships && character.relationships.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Relationships</h5>
                    <div className="space-y-2">
                      {character.relationships.map((rel, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{rel.targetName}</span>
                          <span className="text-muted-foreground"> - {rel.type}</span>
                          <p className="text-sm text-muted-foreground">{rel.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <AddItemButton
          label="Add Character"
          onClick={() => {
            // Open a dialog or prompt for character name
            const name = prompt("Enter character name:");
            if (name && name.trim()) {
              addCharacter(name);
            }
          }}
        />
      </MetadataCard>
      
      {/* Settings Card */}
      <MetadataCard
        title="Settings & Lore"
        icon={<Map className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.settings}
        onToggle={() => toggleCard('settings')}
      >
        <div className="grid grid-cols-1 gap-4">
          {chapter.metadata.settings.map((setting, index) => (
            <Card key={`setting-${index}`} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{setting.name}</h4>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const updatedSettings = [...chapter.metadata.settings];
                    updatedSettings.splice(index, 1);
                    updateMetadata('settings', updatedSettings);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-2">Type</h5>
                  <Badge variant="outline">{setting.attributes.type || 'Unspecified'}</Badge>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Features</h5>
                  <div className="flex flex-wrap gap-2">
                    {setting.attributes.features?.map((feature, i) => (
                      <Badge key={i} variant="secondary">{feature}</Badge>
                    )) || <span className="text-sm text-muted-foreground">No features added</span>}
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-2">Significance</h5>
                  <div className="flex flex-wrap gap-2">
                    {setting.attributes.significance?.map((item, i) => (
                      <Badge key={i} variant="secondary">{item}</Badge>
                    )) || <span className="text-sm text-muted-foreground">No significance details added</span>}
                  </div>
                </div>
                
                {setting.characterConnections && setting.characterConnections.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Character Connections</h5>
                    <div className="space-y-2">
                      {setting.characterConnections.map((conn, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{conn.characterName}</span>
                          <p className="text-sm text-muted-foreground">{conn.connection}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <AddItemButton
          label="Add Setting or Lore"
          onClick={() => {
            // Open a dialog or prompt for setting name
            const name = prompt("Enter setting or lore element name:");
            if (name && name.trim()) {
              addSetting(name);
            }
          }}
        />
      </MetadataCard>
    </div>
  );
} 