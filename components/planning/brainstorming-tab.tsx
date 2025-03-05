"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MoreVertical, Wand2, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/lib/firebase-context';
import { processNote } from '@/lib/services/ai';
import { FirebaseError } from 'firebase/app';

interface IdeaCardProps {
  id: string;
  title: string;
  content: string;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  aiScribeEnabled: boolean;
}

function IdeaCard({ id, title, content, onUpdate, onDelete, aiScribeEnabled }: IdeaCardProps) {
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

  const handleTitleAiContent = (newContent: string) => {
    if (newContent) {
      setEditTitle((current) => {
        const newTitle = current + newContent;
        onUpdate(id, newTitle, editContent);
        return newTitle;
      });
    }
  };

  const handleContentAiContent = (newContent: string) => {
    if (newContent) {
      setEditContent((current) => {
        const newValue = current + newContent;
        onUpdate(id, editTitle, newValue);
        return newValue;
      });
    }
  };

  return (
    <Card className="mb-4 relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <AiEnhancedTextarea
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              onUpdate(id, e.target.value, editContent);
            }}
            className="font-semibold resize-none overflow-hidden p-0 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Idea title..."
            aiScribeEnabled={aiScribeEnabled}
            onAiContent={handleTitleAiContent}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AiEnhancedTextarea
          value={editContent}
          onChange={(e) => {
            setEditContent(e.target.value);
            onUpdate(id, editTitle, e.target.value);
          }}
          className="min-h-[100px] resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Describe your idea..."
          aiScribeEnabled={aiScribeEnabled}
          onAiContent={handleContentAiContent}
        />
      </CardContent>
    </Card>
  );
}

export function BrainstormingTab({ aiScribeEnabled = false }) {
  const [ideas, setIdeas] = useState<Array<{ id: string; title: string; content: string }>>([
    { id: '1', title: 'Main Story Concept', content: 'Start typing your main story concept here...' },
  ]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Brainstorming</h2>
        <Button onClick={addIdea} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Idea
        </Button>
      </div>
      
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Ideas Board</CardTitle>
          <CardDescription>
            Capture your thoughts, concepts, and inspirations for your writing project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
            {ideas.map(idea => (
              <IdeaCard
                key={idea.id}
                id={idea.id}
                title={idea.title}
                content={idea.content}
                onUpdate={updateIdea}
                onDelete={deleteIdea}
                aiScribeEnabled={aiScribeEnabled}
              />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}