"use client";

import { useState } from 'react';
import { User } from 'lucide-react';
import { EntityPanel, EntityField, Entity } from './entity-panel';

interface Character extends Entity {
  id: string;
  name: string;
  description: string;
  [key: string]: string;
}

// Simple function to generate a unique ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function CharactersTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: '1',
      name: 'Main Character',
      description: 'The central character of your story.',
    },
    {
      id: '2',
      name: 'Supporting Character',
      description: 'A character who helps the protagonist.',
    }
  ]);

  const [customFields, setCustomFields] = useState<EntityField[]>([]);

  const addCharacter = () => {
    const newId = generateId();
    const newCharacter: Character = {
      id: newId,
      name: 'New Character',
      description: '',
    };
    setCharacters([...characters, newCharacter]);
  };
  
  const updateCharacter = (id: string, field: string, value: string) => {
    setCharacters(characters.map(char => 
      char.id === id 
        ? { ...char, [field]: value } 
        : char
    ));
  };
  
  const deleteCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };
  
  const addCustomField = (field: EntityField) => {
    setCustomFields([...customFields, field]);
    
    // Add the field to each character with an empty value
    setCharacters(characters.map(char => ({
      ...char,
      [field.key]: '',
    })));
  };
  
  const removeCustomField = (key: string) => {
    setCustomFields(customFields.filter(field => field.key !== key));
    
    // Remove the field from each character
    setCharacters(characters.map(char => {
      const newChar = { ...char };
      delete newChar[key];
      return newChar;
    }));
  };
  
  return (
    <EntityPanel
      title="Characters"
      icon={User}
      entities={characters}
      defaultFields={customFields}
      onAdd={addCharacter}
      onUpdate={updateCharacter}
      onDelete={deleteCharacter}
      onAddField={addCustomField}
      onRemoveField={removeCustomField}
    />
  );
}