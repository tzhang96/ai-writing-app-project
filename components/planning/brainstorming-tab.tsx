"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MoreVertical, Wand2, Filter, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AiScribePopup, useAiScribe } from '@/components/ai-scribe-popup';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/lib/firebase-context';
import { useProjects } from '@/lib/project-context';
import { processNote } from '@/lib/services/ai';
import { FirebaseError } from 'firebase/app';
import { getBrainstorms, createBrainstorm, updateBrainstorm, deleteBrainstorm, Brainstorm } from '@/lib/services/brainstorms';
import { EntityConfirmationDialog } from './entity-confirmation-dialog';
import { saveEntities } from '@/lib/services/entities';
import { findExistingEntity } from '@/lib/services/entities';

interface BrainstormCardProps {
  brainstorm: Brainstorm;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onProcess: (id: string) => void;
  aiScribeEnabled: boolean;
  activeProject: { id: string };
  toast: any;
}

function formatDate(date: Date): string {
  return format(date, 'MMM d, h:mm a');
}

function BrainstormCard({ 
  brainstorm, 
  onUpdate, 
  onDelete, 
  onProcess, 
  aiScribeEnabled,
  activeProject,
  toast 
}: BrainstormCardProps) {
  const [editTitle, setEditTitle] = useState(brainstorm.title);
  const [editContent, setEditContent] = useState(brainstorm.content);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    showAiPopup,
    selectedText,
    popupPosition,
    handleAiAction,
    closePopup
  } = useAiScribe(textareaRef, aiScribeEnabled);

  // Debounced update function
  const handleUpdate = (newTitle: string, newContent: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(brainstorm.id, newTitle, newContent);
    }, 500); // 500ms debounce
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="mb-3 overflow-hidden relative">
      <div 
        className="flex items-center h-9 px-2 cursor-pointer hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
        )}
        
        <Input
          value={editTitle}
          onChange={(e) => {
            e.stopPropagation();
            setEditTitle(e.target.value);
            handleUpdate(e.target.value, editContent);
          }}
          onBlur={() => onUpdate(brainstorm.id, editTitle, editContent)}
          onClick={(e) => e.stopPropagation()}
          className="h-7 px-0 font-medium border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          placeholder="Brainstorm title..."
        />
        
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => onDelete(brainstorm.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className={cn("transition-all", isExpanded ? "max-h-[500px]" : "max-h-0 overflow-hidden")}>
        <CardContent className="pt-2 px-3 pb-2">
          <Textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              handleUpdate(editTitle, e.target.value);
            }}
            onBlur={() => onUpdate(brainstorm.id, editTitle, editContent)}
            className="min-h-[80px] resize-none border focus-visible:ring-1 text-sm"
            placeholder="Describe your brainstorm..."
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-0 px-3 pb-2">
          <span className="text-xs text-muted-foreground">
            Updated: {formatDate(brainstorm.updatedAt)}
          </span>
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 text-xs bg-black hover:bg-black/90 text-white"
            onClick={async () => {
              if (!brainstorm.content.trim()) {
                toast({
                  title: "Error",
                  description: "Please add some content to your brainstorm before processing.",
                  variant: "destructive"
                });
                return;
              }

              setIsProcessing(true);
              try {
                console.log('Attempting to process note:', {
                  content: brainstorm.content
                });
                
                const result = await processNote({
                  content: brainstorm.content
                });

                console.log('Processed note result:', result);
                
                // Check for existing entities
                const existingEntitiesPromises = [
                  ...result.data.extractedEntities.characters.map(async char => {
                    const existing = await findExistingEntity(activeProject.id, 'character', char.name);
                    return {
                      type: 'character' as const,
                      data: char,
                      existingEntity: existing
                    };
                  }),
                  ...result.data.extractedEntities.locations.map(async loc => {
                    const existing = await findExistingEntity(activeProject.id, 'location', loc.name);
                    return {
                      type: 'location' as const,
                      data: loc,
                      existingEntity: existing
                    };
                  }),
                  ...result.data.extractedEntities.events.map(event => ({
                    type: 'event' as const,
                    data: {
                      ...event,
                      title: event.name,
                      description: event.description || event.name
                    }
                  }))
                ];
                
                const entities = await Promise.all(existingEntitiesPromises);
                
                setExtractedEntities(entities);
                setShowConfirmation(true);
              } catch (error) {
                console.error('Error processing note:', error);
                toast({
                  title: "Error",
                  description: "Failed to process the brainstorm. Please try again.",
                  variant: "destructive"
                });
              } finally {
                setIsProcessing(false);
              }
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-1" />
                Process
              </>
            )}
          </Button>
        </CardFooter>
      </div>
      
      {/* AI Scribe Popup */}
      {showAiPopup && (
        <AiScribePopup
          selectedText={selectedText}
          position={popupPosition}
          onAction={handleAiAction}
          onClose={closePopup}
        />
      )}

      {showConfirmation && (
        <EntityConfirmationDialog
          entities={extractedEntities}
          onComplete={async (confirmedEntities) => {
            setShowConfirmation(false);
            
            if (confirmedEntities.length > 0) {
              try {
                await saveEntities(activeProject.id, confirmedEntities);
                toast({
                  title: "Success",
                  description: `Added ${confirmedEntities.length} entities to your story.`,
                });
              } catch (error) {
                console.error('Error saving entities:', error);
                toast({
                  title: "Error",
                  description: "Failed to save the confirmed entities. Please try again.",
                  variant: "destructive"
                });
              }
            } else {
              toast({
                title: "Info",
                description: "No entities were selected to add.",
              });
            }
          }}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </Card>
  );
}

interface BrainstormingTabProps {
  aiScribeEnabled: boolean;
}

export function BrainstormingTab({ aiScribeEnabled }: BrainstormingTabProps) {
  const [brainstorms, setBrainstorms] = useState<Brainstorm[]>([]);
  const [filterTerm, setFilterTerm] = useState('');
  const { toast } = useToast();
  const { user } = useFirebase();
  const { activeProject } = useProjects();

  // Load brainstorms from Firestore
  useEffect(() => {
    const loadBrainstorms = async () => {
      if (!activeProject?.id) return;
      
      try {
        const loadedBrainstorms = await getBrainstorms(activeProject.id);
        setBrainstorms(loadedBrainstorms);
      } catch (error) {
        console.error('Error loading brainstorms:', error);
        toast({
          title: 'Error',
          description: 'Failed to load brainstorms.',
          variant: 'destructive',
        });
      }
    };
    
    loadBrainstorms();
  }, [activeProject?.id, toast]);

  const addBrainstorm = async () => {
    if (!activeProject?.id) {
      toast({
        title: 'Error',
        description: 'No active project selected.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newBrainstorm = await createBrainstorm(activeProject.id, 'New Brainstorm');
      setBrainstorms([newBrainstorm, ...brainstorms]);
    } catch (error) {
      console.error('Error creating brainstorm:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new brainstorm.',
        variant: 'destructive',
      });
    }
  };

  const updateBrainstormItem = async (id: string, title: string, content: string) => {
    try {
      await updateBrainstorm(id, { title, content });
      setBrainstorms(brainstorms.map(item => 
        item.id === id 
          ? { ...item, title, content, updatedAt: new Date() } 
          : item
      ));
    } catch (error) {
      console.error('Error updating brainstorm:', error);
      toast({
        title: 'Error',
        description: 'Failed to update brainstorm.',
        variant: 'destructive',
      });
    }
  };

  const deleteBrainstormItem = async (id: string) => {
    try {
      await deleteBrainstorm(id);
      setBrainstorms(brainstorms.filter(item => item.id !== id));
      toast({
        title: 'Success',
        description: 'Brainstorm deleted.',
      });
    } catch (error) {
      console.error('Error deleting brainstorm:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete brainstorm.',
        variant: 'destructive',
      });
    }
  };
  
  const processBrainstorm = async (id: string) => {
    const brainstorm = brainstorms.find(b => b.id === id);
    if (!brainstorm || !brainstorm.content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your brainstorm before processing.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Attempting to process note:', {
        content: brainstorm.content
      });
      
      const result = await processNote({
        content: brainstorm.content
      });

      console.log('Processed note result:', result);
      
      // Show a more detailed success message
      const entityCounts = {
        characters: result.data.extractedEntities.characters.length,
        locations: result.data.extractedEntities.locations.length,
        events: result.data.extractedEntities.events.length
      };
      
      toast({
        title: "Success",
        description: `Processed and organized: ${entityCounts.characters} characters, ${entityCounts.locations} locations, and ${entityCounts.events} events.`,
      });
    } catch (error) {
      console.error('Error processing note:', error);
      const fbError = error as FirebaseError;
      console.error('Error details:', {
        code: fbError.code,
        message: fbError.message,
        customData: fbError.customData
      });
      toast({
        title: "Error",
        description: "Failed to process your brainstorm. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredBrainstorms = brainstorms.filter(item => 
    item.title.toLowerCase().includes(filterTerm.toLowerCase()) || 
    item.content.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-6 mb-3">
        <div className="relative w-1/3">
          <Filter className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Filter brainstorms..." 
            className="pl-8 h-9"
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
          />
        </div>
        <Button onClick={addBrainstorm} size="sm" className="gap-1 ml-auto">
          <Plus className="h-4 w-4" />
          Add Brainstorm
        </Button>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-190px)]">
            <div className="p-5 pb-8">
              {!activeProject ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a project to view brainstorms.
                </div>
              ) : filteredBrainstorms.length > 0 ? (
                filteredBrainstorms.map(item => (
                  <BrainstormCard
                    key={item.id}
                    brainstorm={item}
                    onUpdate={updateBrainstormItem}
                    onDelete={deleteBrainstormItem}
                    onProcess={processBrainstorm}
                    aiScribeEnabled={aiScribeEnabled}
                    activeProject={activeProject}
                    toast={toast}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {filterTerm ? 'No brainstorms match your filter.' : 'No brainstorms yet. Create one to get started!'}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}