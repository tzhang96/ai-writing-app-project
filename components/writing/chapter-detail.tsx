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
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChapterMetadata, Chapter } from './chapter-types';

export interface ChapterDetailProps {
  chapter: Chapter;
  onGoBack: () => void;
  onChapterUpdate: (chapter: Chapter) => void;
}

export function ChapterDetail({ chapter, onGoBack, onChapterUpdate }: ChapterDetailProps) {
  // State to track which cards are expanded
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    storyBeats: true,
    notes: true,
    characters: true,
    settings: true,
    plotPoints: true
  });

  // Toggle card expansion
  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };
  
  // Update metadata for the chapter
  const updateMetadata = (field: keyof ChapterMetadata, value: any) => {
    const newMetadata = { ...chapter.metadata, [field]: value };
    onChapterUpdate({
      ...chapter,
      metadata: newMetadata
    });
  };
  
  // Add a new character to the chapter
  const addCharacter = (character: string) => {
    if (!character.trim()) return;
    
    const updatedCharacters = [...chapter.metadata.characters, character];
    updateMetadata('characters', updatedCharacters);
  };
  
  // Add a new setting to the chapter
  const addSetting = (setting: string) => {
    if (!setting.trim()) return;
    
    const updatedSettings = [...chapter.metadata.settings, setting];
    updateMetadata('settings', updatedSettings);
  };
  
  // Add a new plot point to the chapter
  const addPlotPoint = (plotPoint: string) => {
    if (!plotPoint.trim()) return;
    
    const updatedPlotPoints = [...chapter.metadata.plotPoints, plotPoint];
    updateMetadata('plotPoints', updatedPlotPoints);
  };
  
  // Remove an item from an array in metadata
  const removeMetadataItem = (field: 'characters' | 'settings' | 'plotPoints', index: number) => {
    const updatedArray = [...chapter.metadata[field]];
    updatedArray.splice(index, 1);
    updateMetadata(field, updatedArray);
  };
  
  return (
    <div className="p-4 space-y-6 overflow-auto pb-20">
      {/* Story Beats Card */}
      <Card className="transition-all duration-200 ease-in-out">
        <CardHeader 
          className="pb-3 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleCard('storyBeats')}
        >
          <CardTitle className="text-md flex items-center">
            <LayoutDashboard className="h-5 w-5 mr-2" />
            Story Beats
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {expandedCards.storyBeats ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </CardHeader>
        {expandedCards.storyBeats && (
          <CardContent>
            <Textarea 
              value={chapter.metadata.storyBeats} 
              onChange={(e) => updateMetadata('storyBeats', e.target.value)}
              placeholder="Enter the key story beats for this chapter..."
              className="min-h-24"
            />
          </CardContent>
        )}
      </Card>

      {/* Notes Card */}
      <Card className="transition-all duration-200 ease-in-out">
        <CardHeader 
          className="pb-3 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleCard('notes')}
        >
          <CardTitle className="text-md flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Notes
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {expandedCards.notes ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </CardHeader>
        {expandedCards.notes && (
          <CardContent>
            <Textarea 
              value={chapter.metadata.notes} 
              onChange={(e) => updateMetadata('notes', e.target.value)}
              placeholder="Additional notes for this chapter..."
              className="min-h-24"
            />
          </CardContent>
        )}
      </Card>
      
      {/* Characters Card */}
      <Card className="transition-all duration-200 ease-in-out">
        <CardHeader 
          className="pb-3 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleCard('characters')}
        >
          <CardTitle className="text-md flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Characters
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {expandedCards.characters ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </CardHeader>
        {expandedCards.characters && (
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input 
                placeholder="Add a character..." 
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCharacter((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addCharacter(input.value);
                  input.value = '';
                }}
              >
                Add
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3">
              {chapter.metadata.characters.map((character: string, index: number) => (
                <div 
                  key={`character-${index}`}
                  className="flex items-start justify-between p-2 border rounded-md bg-card shadow-sm"
                >
                  <span className="text-sm">{character}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1"
                    onClick={() => removeMetadataItem('characters', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Settings Card */}
      <Card className="transition-all duration-200 ease-in-out">
        <CardHeader 
          className="pb-3 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleCard('settings')}
        >
          <CardTitle className="text-md flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Settings & Locations
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {expandedCards.settings ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </CardHeader>
        {expandedCards.settings && (
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input 
                placeholder="Add a setting or location..." 
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSetting((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addSetting(input.value);
                  input.value = '';
                }}
              >
                Add
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3">
              {chapter.metadata.settings.map((setting: string, index: number) => (
                <div 
                  key={`setting-${index}`}
                  className="flex items-start justify-between p-2 border rounded-md bg-card shadow-sm"
                >
                  <span className="text-sm">{setting}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1"
                    onClick={() => removeMetadataItem('settings', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Plot Points Card */}
      <Card className="transition-all duration-200 ease-in-out">
        <CardHeader 
          className="pb-3 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleCard('plotPoints')}
        >
          <CardTitle className="text-md flex items-center">
            Plot Points
          </CardTitle>
          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
            {expandedCards.plotPoints ? 
              <ChevronDown className="h-5 w-5" /> : 
              <ChevronUp className="h-5 w-5" />
            }
          </Button>
        </CardHeader>
        {expandedCards.plotPoints && (
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Input 
                placeholder="Add a plot point..." 
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPlotPoint((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addPlotPoint(input.value);
                  input.value = '';
                }}
              >
                Add
              </Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {chapter.metadata.plotPoints.map((plotPoint: string, index: number) => (
                <div 
                  key={`plot-${index}`}
                  className="flex items-start gap-2 p-2 border rounded-md"
                >
                  <div className="flex-1 text-sm">{plotPoint}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeMetadataItem('plotPoints', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
} 