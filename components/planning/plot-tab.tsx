"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, ChevronDown as ChevronDownIcon, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useProjects } from '@/lib/project-context';
import { useToast } from '@/hooks/use-toast';
import { 
  getEvents, 
  addEvent, 
  updateEvent, 
  deleteEvent,
  type Event
} from '@/lib/services/entities';

const SAMPLE_EVENTS: Event[] = [
  { 
    id: '1', 
    title: 'Introduction', 
    description: 'The beginning of your story...', 
    sequence: 1,
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { 
    id: '2', 
    title: 'Rising Action', 
    description: 'Conflict begins to develop...', 
    sequence: 2,
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { 
    id: '3', 
    title: 'Climax', 
    description: 'The turning point of your story...', 
    sequence: 3,
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { 
    id: '4', 
    title: 'Falling Action', 
    description: 'Events after the climax...', 
    sequence: 4,
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { 
    id: '5', 
    title: 'Resolution', 
    description: 'The conclusion of your story...', 
    sequence: 5,
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

interface PlotPointCardProps { 
  plotPoint: Event;
  onUpdate: (id: string, field: keyof Event, value: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  aiScribeEnabled: boolean;
}

// Debounce helper function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function PlotPointCard({ 
  plotPoint, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast,
  aiScribeEnabled
}: PlotPointCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleAiContent = (newContent: string) => {
    if (newContent) {
      onUpdate(plotPoint.id, 'description', plotPoint.description + newContent);
    }
  };

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
        
        <div className="flex items-center gap-2 mr-2">
          <div className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {plotPoint.sequence}
          </div>
        </div>
        
        <Input
          value={plotPoint.title}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate(plotPoint.id, 'title', e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-7 px-0 font-medium border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          placeholder="Plot point title..."
        />
        
        <div className="ml-auto flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(plotPoint.id);
            }}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(plotPoint.id);
            }}
            disabled={isLast}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
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
                onClick={() => onDelete(plotPoint.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className={cn("transition-all", isExpanded ? "max-h-[500px]" : "max-h-0 overflow-hidden")}>
        <CardContent className="pt-2 px-3 pb-3">
          <AiEnhancedTextarea
            value={plotPoint.description}
            onChange={(e) => onUpdate(plotPoint.id, 'description', e.target.value)}
            className="min-h-[80px] resize-none border focus-visible:ring-1 text-sm"
            placeholder="Describe what happens in this plot point..."
            aiScribeEnabled={aiScribeEnabled}
            onAiContent={handleAiContent}
          />
        </CardContent>
      </div>
    </Card>
  );
}

interface PlotTabProps {
  aiScribeEnabled: boolean;
}

export function PlotTab({ aiScribeEnabled }: PlotTabProps) {
  const { activeProject } = useProjects();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasAttemptedSampleSave = useRef(false);

  // Load events
  useEffect(() => {
    async function loadData() {
      if (!activeProject?.id) return;
      
      try {
        setIsLoading(true);
        const loadedEvents = await getEvents(activeProject.id);
        
        // If no events exist and we haven't tried to save samples yet, create sample events in Firestore
        if (loadedEvents.length === 0 && !hasAttemptedSampleSave.current) {
          hasAttemptedSampleSave.current = true; // Mark that we've attempted to save samples
          try {
            const sampleWithProject = SAMPLE_EVENTS.map(event => ({
              ...event,
              projectId: activeProject.id
            }));
            
            // Create all sample events in Firestore
            const createdEvents = await Promise.all(
              sampleWithProject.map(event => 
                addEvent(activeProject.id, {
                  title: event.title,
                  description: event.description,
                  sequence: event.sequence,
                })
              )
            );
            
            setEvents(createdEvents);
          } catch (error) {
            console.error('Error creating sample events:', error);
            // If saving samples fails, use them locally
            setEvents(SAMPLE_EVENTS.map(event => ({
              ...event,
              projectId: activeProject.id
            })));
            toast({
              title: "Error",
              description: "Failed to save sample plot points. Using them locally instead.",
              variant: "destructive"
            });
          }
        } else {
          setEvents(loadedEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        // On error, use sample data locally only
        setEvents(SAMPLE_EVENTS.map(event => ({
          ...event,
          projectId: activeProject.id
        })));
        toast({
          title: "Error",
          description: "Failed to load plot points. Using sample data instead.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [activeProject?.id, toast]);

  const handleAddEvent = async () => {
    if (!activeProject?.id) return;
    
    try {
      const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
      const newSequence = sortedEvents.length > 0 
        ? sortedEvents[sortedEvents.length - 1].sequence + 1 
        : 1;
      
      const newEvent = await addEvent(activeProject.id, {
        title: 'New Plot Point', 
        description: '', 
        sequence: newSequence,
      });
      
      setEvents(prev => [...prev, newEvent].sort((a, b) => a.sequence - b.sequence));
    } catch (error) {
      console.error('Error adding plot point:', error);
      toast({
        title: "Error",
        description: "Failed to add plot point. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      
      // Remove the event and resequence remaining events
      const remainingEvents = events.filter(e => e.id !== id)
        .sort((a, b) => a.sequence - b.sequence)
        .map((event, index) => ({
          ...event,
          sequence: index + 1
        }));
      
      // Update sequences in Firestore
      await Promise.all(
        remainingEvents.map(event => 
          updateEvent(event.id, { sequence: event.sequence })
        )
      );
      
      setEvents(remainingEvents);
    } catch (error) {
      console.error('Error deleting plot point:', error);
      toast({
        title: "Error",
        description: "Failed to delete plot point. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Debounced update function
  const debouncedUpdate = debounce(async (id: string, updates: Partial<Event>) => {
    try {
      await updateEvent(id, updates);
    } catch (error) {
      console.error('Error updating plot point:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  }, 1000);

  const handleUpdateEvent = (id: string, field: keyof Event, value: string) => {
    // Update local state immediately
    setEvents(prev => prev.map(event => 
      event.id === id 
        ? { ...event, [field]: value } 
        : event
    ));
    
    // Debounced update to Firestore
    debouncedUpdate(id, { [field]: value });
  };

  const handleMoveEventUp = async (id: string) => {
    const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
    const index = sortedEvents.findIndex(e => e.id === id);
    if (index <= 0) return;
    
    try {
      const currentEvent = sortedEvents[index];
      const prevEvent = sortedEvents[index - 1];
      
      // Update sequences
      const newEvents = [...sortedEvents];
      newEvents[index] = { ...currentEvent, sequence: prevEvent.sequence };
      newEvents[index - 1] = { ...prevEvent, sequence: currentEvent.sequence };
      
      // Update local state immediately
      setEvents(newEvents.sort((a, b) => a.sequence - b.sequence));
      
      // Update Firestore
      await Promise.all([
        updateEvent(currentEvent.id, { sequence: prevEvent.sequence }),
        updateEvent(prevEvent.id, { sequence: currentEvent.sequence })
      ]);
    } catch (error) {
      console.error('Error moving plot point up:', error);
      toast({
        title: "Error",
        description: "Failed to reorder plot points. Please try again.",
        variant: "destructive"
      });
      
      // Revert local state on error
      const loadedEvents = await getEvents(activeProject?.id || '');
      setEvents(loadedEvents);
    }
  };
  
  const handleMoveEventDown = async (id: string) => {
    const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
    const index = sortedEvents.findIndex(e => e.id === id);
    if (index >= sortedEvents.length - 1) return;
    
    try {
      const currentEvent = sortedEvents[index];
      const nextEvent = sortedEvents[index + 1];
      
      // Update sequences
      const newEvents = [...sortedEvents];
      newEvents[index] = { ...currentEvent, sequence: nextEvent.sequence };
      newEvents[index + 1] = { ...nextEvent, sequence: currentEvent.sequence };
      
      // Update local state immediately
      setEvents(newEvents.sort((a, b) => a.sequence - b.sequence));
      
      // Update Firestore
      await Promise.all([
        updateEvent(currentEvent.id, { sequence: nextEvent.sequence }),
        updateEvent(nextEvent.id, { sequence: currentEvent.sequence })
      ]);
    } catch (error) {
      console.error('Error moving plot point down:', error);
      toast({
        title: "Error",
        description: "Failed to reorder plot points. Please try again.",
        variant: "destructive"
      });
      
      // Revert local state on error
      const loadedEvents = await getEvents(activeProject?.id || '');
      setEvents(loadedEvents);
    }
  };
  
  // Sort events by sequence
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading plot points...</div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <Button onClick={handleAddEvent} className="ml-auto gap-2">
          <Plus className="h-4 w-4" />
          Add Plot Point
        </Button>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-190px)]">
            <div className="p-5 pb-8">
              {sortedEvents.map((event, index) => (
                <PlotPointCard
                  key={event.id}
                  plotPoint={event}
                  onUpdate={handleUpdateEvent}
                  onDelete={handleDeleteEvent}
                  onMoveUp={handleMoveEventUp}
                  onMoveDown={handleMoveEventDown}
                  isFirst={index === 0}
                  isLast={index === sortedEvents.length - 1}
                  aiScribeEnabled={aiScribeEnabled}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}