"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Palette } from 'lucide-react';

interface StyleExample {
  id: string;
  title: string;
  content: string;
}

function StyleExampleCard({ example, onUpdate, onDelete }: {
  example: StyleExample;
  onUpdate: (id: string, field: keyof StyleExample, value: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Input
            value={example.title}
            onChange={(e) => onUpdate(example.id, 'title', e.target.value)}
            className="font-semibold text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Example title..."
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(example.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={example.content}
          onChange={(e) => onUpdate(example.id, 'content', e.target.value)}
          className="min-h-[150px]"
          placeholder="Write your style example here..."
        />
      </CardContent>
    </Card>
  );
}

export function StyleTab() {
  const [styleNotes, setStyleNotes] = useState({
    voice: "Notes about your narrative voice and tone...",
    pov: "Notes about your point of view (first person, third person, etc.)...",
    tense: "Notes about your tense (past, present, etc.)...",
    dialogue: "Notes about your dialogue style and formatting..."
  });
  
  const [styleExamples, setStyleExamples] = useState<StyleExample[]>([
    { id: '1', title: 'Example Passage', content: 'This is an example of your writing style...' }
  ]);
  
  const updateStyleNote = (field: keyof typeof styleNotes, value: string) => {
    setStyleNotes({ ...styleNotes, [field]: value });
  };
  
  const addStyleExample = () => {
    const newId = Date.now().toString();
    setStyleExamples([...styleExamples, { id: newId, title: 'New Example', content: '' }]);
  };
  
  const updateStyleExample = (id: string, field: keyof StyleExample, value: string) => {
    setStyleExamples(styleExamples.map(example => 
      example.id === id 
        ? { ...example, [field]: value } 
        : example
    ));
  };
  
  const deleteStyleExample = (id: string) => {
    setStyleExamples(styleExamples.filter(example => example.id !== id));
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Writing Style
        </h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 h-full">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Style Guidelines</CardTitle>
            <CardDescription>
              Define your writing style, voice, and technical preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <Tabs defaultValue="voice" className="w-full h-full flex flex-col">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
                <TabsTrigger value="pov">Point of View</TabsTrigger>
                <TabsTrigger value="tense">Tense</TabsTrigger>
                <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 pt-4">
                <TabsContent value="voice" className="h-full">
                  <Textarea 
                    className="min-h-[300px] h-full"
                    placeholder="Describe your narrative voice and tone..."
                    value={styleNotes.voice}
                    onChange={(e) => updateStyleNote('voice', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="pov" className="h-full">
                  <Textarea 
                    className="min-h-[300px] h-full"
                    placeholder="Describe your point of view approach..."
                    value={styleNotes.pov}
                    onChange={(e) => updateStyleNote('pov', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="tense" className="h-full">
                  <Textarea 
                    className="min-h-[300px] h-full"
                    placeholder="Describe your tense preferences..."
                    value={styleNotes.tense}
                    onChange={(e) => updateStyleNote('tense', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="dialogue" className="h-full">
                  <Textarea 
                    className="min-h-[300px] h-full"
                    placeholder="Describe your dialogue style and formatting..."
                    value={styleNotes.dialogue}
                    onChange={(e) => updateStyleNote('dialogue', e.target.value)}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader className="flex-row justify-between items-start space-y-0">
            <div>
              <CardTitle>Style Examples</CardTitle>
              <CardDescription>
                Create examples that showcase your writing style.
              </CardDescription>
            </div>
            <Button onClick={addStyleExample} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Example
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {styleExamples.map(example => (
                <StyleExampleCard
                  key={example.id}
                  example={example}
                  onUpdate={updateStyleExample}
                  onDelete={deleteStyleExample}
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}