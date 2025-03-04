"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, User, Users, Trash2 } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  background: string;
  motivation: string;
  traits: string;
}

function CharacterCard({ character, onSelect, isSelected }: { 
  character: Character; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <Card 
      className={`mb-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {character.name}
        </CardTitle>
        <CardDescription>{character.role}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: '1',
      name: 'Main Character',
      role: 'Protagonist',
      description: 'The central character of your story.',
      background: 'Background details here...',
      motivation: 'What drives this character?',
      traits: 'Key personality traits...'
    }
  ]);
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(characters[0]?.id || '');
  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  
  const addCharacter = () => {
    const newId = Date.now().toString();
    const newCharacter: Character = {
      id: newId,
      name: 'New Character',
      role: 'Role',
      description: '',
      background: '',
      motivation: '',
      traits: ''
    };
    setCharacters([...characters, newCharacter]);
    setSelectedCharacterId(newId);
  };
  
  const updateCharacter = (field: keyof Character, value: string) => {
    setCharacters(characters.map(char => 
      char.id === selectedCharacterId 
        ? { ...char, [field]: value } 
        : char
    ));
  };
  
  const deleteCharacter = () => {
    const newCharacters = characters.filter(c => c.id !== selectedCharacterId);
    setCharacters(newCharacters);
    setSelectedCharacterId(newCharacters[0]?.id || '');
  };
  
  return (
    <div className="h-full grid grid-cols-[300px_1fr] gap-4">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Characters
          </h2>
          <Button size="sm" onClick={addCharacter}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          {characters.map(character => (
            <CharacterCard 
              key={character.id} 
              character={character} 
              onSelect={() => setSelectedCharacterId(character.id)}
              isSelected={character.id === selectedCharacterId}
            />
          ))}
        </ScrollArea>
      </div>
      
      {selectedCharacter && (
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-row justify-between items-start space-y-0">
            <div>
              <CardTitle>Character Details</CardTitle>
              <CardDescription>Develop your character's profile</CardDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={deleteCharacter}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={selectedCharacter.name} 
                    onChange={(e) => updateCharacter('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input 
                    value={selectedCharacter.role} 
                    onChange={(e) => updateCharacter('role', e.target.value)}
                  />
                </div>
              </div>
              
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                  <TabsTrigger value="motivation">Motivation</TabsTrigger>
                  <TabsTrigger value="traits">Traits</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Describe your character's appearance, mannerisms, and general presence..."
                    value={selectedCharacter.description}
                    onChange={(e) => updateCharacter('description', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="background" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="Detail your character's history, upbringing, and formative experiences..."
                    value={selectedCharacter.background}
                    onChange={(e) => updateCharacter('background', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="motivation" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="What drives your character? What are their goals, desires, and fears?"
                    value={selectedCharacter.motivation}
                    onChange={(e) => updateCharacter('motivation', e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="traits" className="pt-4">
                  <Textarea 
                    className="min-h-[300px]"
                    placeholder="List your character's personality traits, quirks, strengths, and weaknesses..."
                    value={selectedCharacter.traits}
                    onChange={(e) => updateCharacter('traits', e.target.value)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}