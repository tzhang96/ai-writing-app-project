"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Palette } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  const handleAiContent = (newContent: string) => {
    if (newContent) {
      onUpdate(example.id, 'content', example.content + newContent);
    }
  };

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
        <AiEnhancedTextarea
          value={example.content}
          onChange={(e) => onUpdate(example.id, 'content', e.target.value)}
          className="min-h-[80px] max-h-[120px] border-none focus-visible:ring-0 text-sm"
          placeholder="Write your style example here..."
          aiScribeEnabled={true}
          onAiContent={handleAiContent}
        />
      </div>
    </div>
  );
}

export function StyleTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
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
  
  const handleVoiceAiContent = (newContent: string) => {
    if (newContent) {
      setStyleNotes({ ...styleNotes, voice: styleNotes.voice + newContent });
    }
  };
  
  const handlePovAiContent = (newContent: string) => {
    if (newContent) {
      setStyleNotes({ ...styleNotes, pov: styleNotes.pov + newContent });
    }
  };
  
  const handleTenseAiContent = (newContent: string) => {
    if (newContent) {
      setStyleNotes({ ...styleNotes, tense: styleNotes.tense + newContent });
    }
  };
  
  const handleDialogueAiContent = (newContent: string) => {
    if (newContent) {
      setStyleNotes({ ...styleNotes, dialogue: styleNotes.dialogue + newContent });
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-4 p-6 pb-8">
              {/* Voice & Tone Section */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Voice & Tone</Label>
                <AiEnhancedTextarea 
                  className="min-h-[80px] text-sm resize-none"
                  placeholder="Describe your narrative voice and tone..."
                  value={styleNotes.voice}
                  onChange={(e) => updateStyleNote('voice', e.target.value)}
                  aiScribeEnabled={aiScribeEnabled}
                  onAiContent={handleVoiceAiContent}
                />
              </div>
              
              {/* Point of View Section */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Point of View</Label>
                <AiEnhancedTextarea 
                  className="min-h-[80px] text-sm resize-none"
                  placeholder="Describe your point of view approach..."
                  value={styleNotes.pov}
                  onChange={(e) => updateStyleNote('pov', e.target.value)}
                  aiScribeEnabled={aiScribeEnabled}
                  onAiContent={handlePovAiContent}
                />
              </div>
              
              {/* Tense Section */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tense</Label>
                <AiEnhancedTextarea 
                  className="min-h-[80px] text-sm resize-none"
                  placeholder="Describe your tense preferences..."
                  value={styleNotes.tense}
                  onChange={(e) => updateStyleNote('tense', e.target.value)}
                  aiScribeEnabled={aiScribeEnabled}
                  onAiContent={handleTenseAiContent}
                />
              </div>
              
              {/* Dialogue Section */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Dialogue</Label>
                <AiEnhancedTextarea 
                  className="min-h-[80px] text-sm resize-none"
                  placeholder="Describe your dialogue style and formatting..."
                  value={styleNotes.dialogue}
                  onChange={(e) => updateStyleNote('dialogue', e.target.value)}
                  aiScribeEnabled={aiScribeEnabled}
                  onAiContent={handleDialogueAiContent}
                />
              </div>
              
              <Separator className="my-3" />
              
              {/* Style Examples Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">Style Examples</Label>
                </div>
                
                <div className="space-y-2">
                  {styleExamples.map(example => (
                    <StyleExampleCard
                      key={example.id}
                      example={example}
                      onUpdate={updateStyleExample}
                      onDelete={deleteStyleExample}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={addStyleExample} 
                  size="sm" 
                  variant="outline" 
                  className="mt-3 h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Example
                </Button>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}