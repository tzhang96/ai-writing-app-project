"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/lib/firebase-context';
import { processNote } from '@/lib/services/ai';
import { useProjects } from '@/lib/project-context';
import { FirebaseError } from 'firebase/app';

interface IdeaCardProps {
  id: string;
  title: string;
  content: string;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onProcess: (id: string) => void;
}

function IdeaCard({ id, title, content, onUpdate, onDelete, onProcess }: IdeaCardProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Textarea
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              onUpdate(id, e.target.value, editContent);
            }}
            className="font-semibold resize-none overflow-hidden p-0 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Idea title..."
          />
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onProcess(id)}
              className="h-8 w-8"
              disabled={isProcessing}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={editContent}
          onChange={(e) => {
            setEditContent(e.target.value);
            onUpdate(id, editTitle, e.target.value);
          }}
          className="min-h-[100px] resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Describe your idea..."
        />
      </CardContent>
    </Card>
  );
}

export function BrainstormingTab() {
  const [ideas, setIdeas] = useState<Array<{ id: string; title: string; content: string }>>([
    { id: '1', title: 'Main Story Concept', content: 'Start typing your main story concept here...' },
  ]);
  const { toast } = useToast();
  const { user } = useFirebase();
  const { activeProject } = useProjects();

  const addIdea = () => {
    const newId = Date.now().toString();
    setIdeas([...ideas, { id: newId, title: 'New Idea', content: '' }]);
  };

  const updateIdea = (id: string, title: string, content: string) => {
    setIdeas(ideas.map(idea => idea.id === id ? { ...idea, title, content } : idea));
  };

  const deleteIdea = (id: string) => {
    setIdeas(ideas.filter(idea => idea.id !== id));
  };

  const processIdea = async (id: string) => {
    const idea = ideas.find(i => i.id === id);
    if (!idea || !idea.content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your idea before processing.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Attempting to process note:', {
        content: idea.content
      });
      
      const result = await processNote({
        content: idea.content
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
        description: "Failed to process your idea. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={addIdea} className="ml-auto gap-2">
          <Plus className="h-4 w-4" />
          Add Idea
        </Button>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-240px)]">
            <div className="p-6 pb-8">
              {ideas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  id={idea.id}
                  title={idea.title}
                  content={idea.content}
                  onUpdate={updateIdea}
                  onDelete={deleteIdea}
                  onProcess={processIdea}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}