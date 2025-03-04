"use client";

import { useState } from 'react';
import { Map } from 'lucide-react';
import { EntityPanel, EntityField, Entity } from './entity-panel';

interface World extends Entity {
  id: string;
  name: string;
  description: string;
  [key: string]: string;
}

// Simple function to generate a unique ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function WorldTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
  const [worlds, setWorlds] = useState<World[]>([
    {
      id: '1',
      name: 'Main World',
      description: 'The primary world of your story.',
    },
    {
      id: '2',
      name: 'Secondary World',
      description: 'Another important location in your story.',
    }
  ]);

  const [customFields, setCustomFields] = useState<EntityField[]>([]);

  const addWorld = () => {
    const newId = generateId();
    const newWorld: World = {
      id: newId,
      name: 'New World',
      description: '',
    };
    setWorlds([...worlds, newWorld]);
  };
  
  const updateWorld = (id: string, field: string, value: string) => {
    setWorlds(worlds.map(world => 
      world.id === id 
        ? { ...world, [field]: value } 
        : world
    ));
  };
  
  const deleteWorld = (id: string) => {
    setWorlds(worlds.filter(w => w.id !== id));
  };
  
  const addCustomField = (field: EntityField) => {
    setCustomFields([...customFields, field]);
    
    // Add the field to each world with an empty value
    setWorlds(worlds.map(world => ({
      ...world,
      [field.key]: '',
    })));
  };
  
  const removeCustomField = (key: string) => {
    setCustomFields(customFields.filter(field => field.key !== key));
    
    // Remove the field from each world
    setWorlds(worlds.map(world => {
      const newWorld = { ...world };
      delete newWorld[key];
      return newWorld;
    }));
  };
  
  return (
    <EntityPanel
      title="Worlds"
      icon={Map}
      entities={worlds}
      defaultFields={customFields}
      onAdd={addWorld}
      onUpdate={updateWorld}
      onDelete={deleteWorld}
      onAddField={addCustomField}
      onRemoveField={removeCustomField}
    />
  );
}