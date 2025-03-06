"use client";

import { useState, useEffect } from 'react';
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
  BookOpen,
  Loader2,
  StickyNote
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetadataCard, AddItemButton } from './metadata-card';
import { AiEnhancedTextarea } from "@/components/ui/ai-enhanced-textarea";
import { EntitySearchModal } from './entity-search-modal';
import { Entity, ChapterWithRelationships } from '@/lib/db/types';
import { getChapterWithRelationships, addEntityToChapter, removeEntityFromChapter, createChapterBeat, deleteChapterBeat, createChapterNote, deleteChapterNote } from '@/lib/db/chapters';

export interface ChapterDetailProps {
  chapter: ChapterWithRelationships;
  projectId: string;
  onGoBack: () => void;
  onChapterUpdate: (chapter: ChapterWithRelationships) => void;
  aiScribeEnabled?: boolean;
}

function renderCharacterMetadata(character: Entity) {
  const metadata = character.metadata || {};
  
  type CharacterColorType = 'aliases' | 'personality' | 'appearance' | 'background';
  const getRotatingColors = (index: number, type: CharacterColorType): string => {
    const colorSets = {
      aliases: [
        "bg-violet-100 text-violet-800 hover:bg-violet-200",
        "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200",
        "bg-purple-100 text-purple-800 hover:bg-purple-200",
      ],
      personality: [
        "bg-rose-100 text-rose-800 hover:bg-rose-200",
        "bg-pink-100 text-pink-800 hover:bg-pink-200",
        "bg-red-100 text-red-800 hover:bg-red-200",
      ],
      appearance: [
        "bg-sky-100 text-sky-800 hover:bg-sky-200",
        "bg-blue-100 text-blue-800 hover:bg-blue-200",
        "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
      ],
      background: [
        "bg-amber-100 text-amber-800 hover:bg-amber-200",
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        "bg-orange-100 text-orange-800 hover:bg-orange-200",
      ],
    } as const;
    return colorSets[type][index % colorSets[type].length];
  };

  return (
    <div className="space-y-3">
      {metadata.description && (
        <p className="text-sm text-muted-foreground">
          {metadata.description}
        </p>
      )}
      
      {/* Aliases */}
      {metadata.aliases && metadata.aliases.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Also known as:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.aliases.map((alias: string, index: number) => (
              <Badge 
                key={`alias-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'aliases')}
              >
                {alias}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Personality Traits */}
      {metadata.attributes?.personality && metadata.attributes.personality.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Personality:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.personality.map((trait: string, index: number) => (
              <Badge 
                key={`personality-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'personality')}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Appearance */}
      {metadata.attributes?.appearance && metadata.attributes.appearance.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Appearance:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.appearance.map((trait: string, index: number) => (
              <Badge 
                key={`appearance-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'appearance')}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Background */}
      {metadata.attributes?.background && metadata.attributes.background.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Background:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.background.map((trait: string, index: number) => (
              <Badge 
                key={`background-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'background')}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Render plot point metadata
const renderPlotPointMetadata = (plotPoint: Entity) => {
  const metadata = plotPoint.metadata || {};
  
  type PlotPointColorType = 'type' | 'events' | 'impact' | 'connections';
  const getRotatingColors = (index: number, type: PlotPointColorType): string => {
    const colorSets = {
      type: [
        "bg-rose-100 text-rose-800 hover:bg-rose-200",
        "bg-pink-100 text-pink-800 hover:bg-pink-200",
        "bg-red-100 text-red-800 hover:bg-red-200",
      ],
      events: [
        "bg-amber-100 text-amber-800 hover:bg-amber-200",
        "bg-orange-100 text-orange-800 hover:bg-orange-200",
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      ],
      impact: [
        "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        "bg-green-100 text-green-800 hover:bg-green-200",
        "bg-teal-100 text-teal-800 hover:bg-teal-200",
      ],
      connections: [
        "bg-violet-100 text-violet-800 hover:bg-violet-200",
        "bg-purple-100 text-purple-800 hover:bg-purple-200",
        "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200",
      ],
    } as const;
    return colorSets[type][index % colorSets[type].length];
  };

  return (
    <div className="space-y-3">
      {metadata.description && (
        <p className="text-sm text-muted-foreground">
          {metadata.description}
        </p>
      )}
      
      {/* Type */}
      {metadata.attributes?.type && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Type:</p>
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="secondary"
              className={getRotatingColors(0, 'type')}
            >
              {metadata.attributes.type}
            </Badge>
          </div>
        </div>
      )}
      
      {/* Events */}
      {Array.isArray(metadata.attributes?.events) && metadata.attributes.events.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Key Events:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.events.map((event: string, index: number) => (
              <Badge 
                key={`event-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'events')}
              >
                {event}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Impact */}
      {Array.isArray(metadata.attributes?.impact) && metadata.attributes.impact.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Story Impact:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.impact.map((item: string, index: number) => (
              <Badge 
                key={`impact-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'impact')}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Character Connections */}
      {Array.isArray(metadata.attributes?.connections) && metadata.attributes.connections.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Character Connections:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.attributes.connections.map((connection: string, index: number) => (
              <Badge 
                key={`connection-${index}`} 
                variant="secondary"
                className={getRotatingColors(index, 'connections')}
              >
                {connection}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function ChapterDetail({ 
  chapter, 
  projectId,
  onGoBack, 
  onChapterUpdate, 
  aiScribeEnabled = true 
}: ChapterDetailProps) {
  // State for expanded cards
  const [expandedCards, setExpandedCards] = useState({
    characters: true,
    settings: true,
    plotPoints: true,
    storyBeats: true,
    notes: true,
  });
  
  // State for search modal
  const [searchModal, setSearchModal] = useState<{
    isOpen: boolean;
    type: 'character' | 'setting' | 'plotPoint';
  }>({
    isOpen: false,
    type: 'character',
  });
  
  // State for new beat/note
  const [newBeat, setNewBeat] = useState({ title: '', content: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isAddingBeat, setIsAddingBeat] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch chapter data with relationships
  const refreshChapterData = async () => {
    setIsLoading(true);
    try {
      const updatedChapter = await getChapterWithRelationships(chapter.id);
      onChapterUpdate(updatedChapter);
    } catch (error) {
      console.error('Error refreshing chapter data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle card expansion
  const toggleCard = (cardName: keyof typeof expandedCards) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };
  
  // Handle adding an entity
  const handleAddEntity = async (entity: Entity) => {
    if (!searchModal) return;
    
    setIsLoading(true);
    try {
      await addEntityToChapter(chapter.id, entity.id, entity.type, projectId);
      await refreshChapterData();
    } catch (error) {
      console.error('Error adding entity:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle removing an entity
  const handleRemoveEntity = async (entityId: string) => {
    setIsLoading(true);
    try {
      await removeEntityFromChapter(chapter.id, entityId);
      await refreshChapterData();
    } catch (error) {
      console.error('Error removing entity:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render setting metadata
  const renderSettingMetadata = (setting: Entity) => {
    const metadata = setting.metadata || {};
    
    type SettingColorType = 'type' | 'features' | 'significance';
    const getRotatingColors = (index: number, type: SettingColorType): string => {
      const colorSets = {
        type: [
          "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
          "bg-green-100 text-green-800 hover:bg-green-200",
          "bg-teal-100 text-teal-800 hover:bg-teal-200",
        ],
        features: [
          "bg-cyan-100 text-cyan-800 hover:bg-cyan-200",
          "bg-sky-100 text-sky-800 hover:bg-sky-200",
          "bg-blue-100 text-blue-800 hover:bg-blue-200",
        ],
        significance: [
          "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
          "bg-violet-100 text-violet-800 hover:bg-violet-200",
          "bg-purple-100 text-purple-800 hover:bg-purple-200",
        ],
      } as const;
      return colorSets[type][index % colorSets[type].length];
    };

    return (
      <div className="space-y-3">
        {metadata.description && (
          <p className="text-sm text-muted-foreground">
            {metadata.description}
          </p>
        )}
        
        {/* Type */}
        {metadata.attributes?.type && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Type:</p>
            <div className="flex flex-wrap gap-1">
              <Badge 
                variant="secondary"
                className={getRotatingColors(0, 'type')}
              >
                {metadata.attributes.type}
              </Badge>
            </div>
          </div>
        )}
        
        {/* Features */}
        {Array.isArray(metadata.attributes?.features) && metadata.attributes.features.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Features:</p>
            <div className="flex flex-wrap gap-1">
              {metadata.attributes.features.map((feature: string, index: number) => (
                <Badge 
                  key={`feature-${index}`} 
                  variant="secondary"
                  className={getRotatingColors(index, 'features')}
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Significance */}
        {Array.isArray(metadata.attributes?.significance) && metadata.attributes.significance.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Significance:</p>
            <div className="flex flex-wrap gap-1">
              {metadata.attributes.significance.map((item: string, index: number) => (
                <Badge 
                  key={`significance-${index}`} 
                  variant="secondary"
                  className={getRotatingColors(index, 'significance')}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Function to handle adding a new beat
  const handleAddBeat = async () => {
    if (!newBeat.title || !newBeat.content) return;
    
    try {
      const order = chapter.beats?.length || 0;
      await createChapterBeat(
        chapter.id,
        projectId,
        newBeat.title,
        newBeat.content,
        order
      );
      
      // Refresh chapter data
      const updatedChapter = await getChapterWithRelationships(chapter.id);
      onChapterUpdate(updatedChapter);
      
      // Reset form
      setNewBeat({ title: '', content: '' });
      setIsAddingBeat(false);
    } catch (error) {
      console.error('Error adding beat:', error);
    }
  };

  // Function to handle adding a new note
  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;
    
    try {
      await createChapterNote(
        chapter.id,
        projectId,
        newNote.title,
        newNote.content
      );
      
      // Refresh chapter data
      const updatedChapter = await getChapterWithRelationships(chapter.id);
      onChapterUpdate(updatedChapter);
      
      // Reset form
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Function to handle deleting a beat
  const handleDeleteBeat = async (beatId: string) => {
    try {
      await deleteChapterBeat(beatId);
      
      // Refresh chapter data
      const updatedChapter = await getChapterWithRelationships(chapter.id);
      onChapterUpdate(updatedChapter);
    } catch (error) {
      console.error('Error deleting beat:', error);
    }
  };

  // Function to handle deleting a note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteChapterNote(noteId);
      
      // Refresh chapter data
      const updatedChapter = await getChapterWithRelationships(chapter.id);
      onChapterUpdate(updatedChapter);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };
  
  // Function to close search modal
  const closeSearchModal = () => {
    setSearchModal({
      isOpen: false,
      type: 'character'
    });
  };

  // Function to open search modal
  const openSearchModal = (type: 'character' | 'setting' | 'plotPoint') => {
    setSearchModal({
      isOpen: true,
      type
    });
  };
  
  return (
    <div className="space-y-4 p-4">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      
      {/* Characters Card */}
      <MetadataCard
        title="Characters"
        icon={<Users className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.characters}
        onToggle={() => toggleCard('characters')}
      >
        <div className="grid grid-cols-1 gap-4">
          {chapter.connections.characters.map((character) => (
            <Card key={character.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{character.name}</h4>
                  {renderCharacterMetadata(character)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveEntity(character.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <AddItemButton
          label="Add Character"
          onClick={() => openSearchModal('character')}
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
          {chapter.connections.settings.map((setting) => (
            <Card key={setting.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{setting.name}</h4>
                  {renderSettingMetadata(setting)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveEntity(setting.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <AddItemButton
          label="Add Setting or Lore"
          onClick={() => openSearchModal('setting')}
        />
      </MetadataCard>
      
      {/* Plot Points Card */}
      <MetadataCard
        title="Plot Points"
        icon={<BookOpen className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.plotPoints}
        onToggle={() => toggleCard('plotPoints')}
      >
        <div className="grid grid-cols-1 gap-4">
          {chapter.connections.plotPoints.map((plotPoint) => (
            <Card key={plotPoint.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{plotPoint.name}</h4>
                  {renderPlotPointMetadata(plotPoint)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveEntity(plotPoint.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <AddItemButton
          label="Add Plot Point"
          onClick={() => openSearchModal('plotPoint')}
        />
      </MetadataCard>
      
      {/* Story Beats Card */}
      <MetadataCard
        title="Story Beats"
        icon={<LayoutDashboard className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.storyBeats}
        onToggle={() => toggleCard('storyBeats')}
      >
        <div className="space-y-4">
          {chapter.beats?.map((beat) => (
            <Card key={beat.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{beat.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{beat.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteBeat(beat.id!)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {isAddingBeat ? (
            <Card className="p-4">
              <div className="space-y-4">
                <Input
                  placeholder="Beat title..."
                  value={newBeat.title}
                  onChange={(e) => setNewBeat(prev => ({ ...prev, title: e.target.value }))}
                />
                <div className="relative pt-10">
                  <AiEnhancedTextarea
                    placeholder="Beat content..."
                    value={newBeat.content}
                    onChange={(e) => setNewBeat(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[100px]"
                    aiScribeEnabled={aiScribeEnabled}
                    chapterId={chapter.id}
                    projectId={projectId}
                    contentType="beat"
                    onAiContent={(content, title) => {
                      setNewBeat(prev => ({
                        ...prev,
                        content,
                        title: title || prev.title
                      }));
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddingBeat(false)}>Cancel</Button>
                  <Button onClick={handleAddBeat}>Add Beat</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingBeat(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Beat
            </Button>
          )}
        </div>
      </MetadataCard>
      
      {/* Notes Card */}
      <MetadataCard
        title="Notes"
        icon={<StickyNote className="h-5 w-5 mr-2" />}
        isExpanded={expandedCards.notes}
        onToggle={() => toggleCard('notes')}
      >
        <div className="space-y-4">
          {chapter.notes?.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{note.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteNote(note.id!)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {isAddingNote ? (
            <Card className="p-4">
              <div className="space-y-4">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                />
                <div className="relative pt-10">
                  <AiEnhancedTextarea
                    placeholder="Note content..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[100px]"
                    aiScribeEnabled={aiScribeEnabled}
                    chapterId={chapter.id}
                    projectId={projectId}
                    contentType="note"
                    onAiContent={(content, title) => {
                      setNewNote(prev => ({
                        ...prev,
                        content,
                        title: title || prev.title
                      }));
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddingNote(false)}>Cancel</Button>
                  <Button onClick={handleAddNote}>Add Note</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </div>
      </MetadataCard>
      
      {/* Search Modal */}
      {searchModal && (
        <EntitySearchModal
          isOpen={searchModal.isOpen}
          onClose={closeSearchModal}
          onSelect={handleAddEntity}
          projectId={projectId}
          entityType={searchModal.type}
          title={
            searchModal.type === 'character' ? 'Character' :
            searchModal.type === 'setting' ? 'Setting or Lore' :
            'Plot Point'
          }
        />
      )}
    </div>
  );
}