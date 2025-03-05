"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useProjects } from '@/lib/project-context';
import { StyleExample, Style, getStyle, saveStyle } from '@/lib/services/entities';
import { useToast } from '@/components/ui/use-toast';

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

interface StyleExampleCard {
  example: StyleExample;
  onUpdate: (id: string, field: keyof StyleExample, value: string) => void;
  onDelete: (id: string) => void;
}

function StyleExampleCard({ example, onUpdate, onDelete }: StyleExampleCard) {
  return (
    <div className="mb-3 border rounded-md">
      <div className="p-2 pb-1">
        <div className="flex items-center justify-between">
          <Input
            value={example.title}
            onChange={(e) => onUpdate(example.id, 'title', e.target.value)}
            className="font-semibold text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-7"
            placeholder="Example title..."
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(example.id)}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-2 pt-0">
        <Textarea
          value={example.content}
          onChange={(e) => onUpdate(example.id, 'content', e.target.value)}
          className="min-h-[80px] max-h-[120px] border-none focus-visible:ring-0 text-sm"
          placeholder="Write your style example here..."
        />
      </div>
    </div>
  );
}

export function StyleTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
  const { activeProject } = useProjects();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  const [styleNotes, setStyleNotes] = useState({
    voice: "",
    pov: "",
    tense: "",
    dialogue: ""
  });
  
  const [styleExamples, setStyleExamples] = useState<StyleExample[]>([]);
  const [styleId, setStyleId] = useState<string | null>(null);

  // Load initial style data
  useEffect(() => {
    async function loadStyle() {
      if (!activeProject?.id) return;
      
      try {
        setIsLoading(true);
        const style = await getStyle(activeProject.id);
        
        if (style) {
          setStyleId(style.id);
          setStyleNotes({
            voice: style.voice || "",
            pov: style.pov || "",
            tense: style.tense || "",
            dialogue: style.dialogue || ""
          });
          setStyleExamples(style.examples || []);
        }
      } catch (error) {
        console.error('Error loading style:', error);
        toast({
          title: "Error",
          description: "Failed to load style settings",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStyle();
  }, [activeProject?.id, toast]);

  // Debounced save to Firestore
  const debouncedSave = useCallback(
    debounce(async (updates: Partial<Style>) => {
      if (!activeProject?.id) return;
      
      try {
        await saveStyle(activeProject.id, {
          ...styleNotes,
          examples: styleExamples,
          ...updates
        });
      } catch (error) {
        console.error('Error saving style:', error);
        toast({
          title: "Error",
          description: "Failed to save style settings",
          variant: "destructive"
        });
      }
    }, 1000),
    [activeProject?.id, styleNotes, styleExamples, toast]
  );

  const updateStyleNote = (field: keyof typeof styleNotes, value: string) => {
    // Update local state immediately
    setStyleNotes(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Debounce the save to Firestore
    debouncedSave({ [field]: value });
  };
  
  const updateStyleExample = (id: string, field: keyof StyleExample, value: string) => {
    // Update local state immediately
    setStyleExamples(prev => {
      const newExamples = prev.map(example => 
        example.id === id 
          ? { ...example, [field]: value } 
          : example
      );
      
      // Debounce the save to Firestore with all examples
      debouncedSave({ examples: newExamples });
      
      return newExamples;
    });
  };

  const addStyleExample = () => {
    const newId = Date.now().toString();
    const newExample = { id: newId, title: 'New Example', content: '' };
    
    // Update local state immediately
    setStyleExamples(prev => {
      const newExamples = [...prev, newExample];
      
      // Save to Firestore with all examples
      debouncedSave({ examples: newExamples });
      
      return newExamples;
    });
  };
  
  const deleteStyleExample = (id: string) => {
    // Update local state immediately
    setStyleExamples(prev => {
      const newExamples = prev.filter(example => example.id !== id);
      
      // Save to Firestore with remaining examples
      debouncedSave({ examples: newExamples });
      
      return newExamples;
    });
  };

  if (!activeProject) {
    return null;
  }
  
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Writing Style</CardTitle>
          <CardDescription>Define and document your writing style preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-6">
              <div>
                <Label>Voice & Tone</Label>
                <Textarea
                  value={styleNotes.voice}
                  onChange={(e) => updateStyleNote('voice', e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Describe your story's voice and tone..."
                />
              </div>
              
              <div>
                <Label>Point of View</Label>
                <Textarea
                  value={styleNotes.pov}
                  onChange={(e) => updateStyleNote('pov', e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Describe your story's point of view..."
                />
              </div>
              
              <div>
                <Label>Tense</Label>
                <Textarea
                  value={styleNotes.tense}
                  onChange={(e) => updateStyleNote('tense', e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Describe your story's tense..."
                />
              </div>
              
              <div>
                <Label>Dialogue Style</Label>
                <Textarea
                  value={styleNotes.dialogue}
                  onChange={(e) => updateStyleNote('dialogue', e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Describe your story's dialogue style..."
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Style Examples</Label>
                  <Button onClick={addStyleExample} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>
                
                {styleExamples.map((example) => (
                  <StyleExampleCard
                    key={example.id}
                    example={example}
                    onUpdate={updateStyleExample}
                    onDelete={deleteStyleExample}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}