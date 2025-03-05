"use client";

import { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { EntityPanel, EntityField } from './entity-panel';
import { useProjects } from '@/lib/project-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Character,
  EntityField as EntityFieldType,
  COLLECTIONS,
  getCharacters,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  getCustomFields,
  addCustomField,
  deleteCustomField
} from '@/lib/services/entities';

// Simple function to generate a unique ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

// Sample character data to show when no characters exist
export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'sample-1',
    projectId: '',
    name: 'Sarah Chen',
    description: 'A brilliant computer scientist who discovers an AI that becomes sentient. She struggles with the ethical implications of her creation while trying to protect it from those who would abuse its power.',
    role: 'Protagonist',
    age: '28',
    occupation: 'AI Researcher',
    goals: 'To ensure AI development benefits humanity while preventing its misuse',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sample-2',
    projectId: '',
    name: 'Dr. Marcus Webb',
    description: 'A veteran AI ethicist who becomes both a mentor and potential antagonist to Sarah. His past experiences with failed AI projects make him deeply skeptical of her work.',
    role: 'Mentor/Antagonist',
    age: '55',
    occupation: 'Ethics Professor',
    goals: 'To prevent what he sees as dangerous AI development',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function CharactersTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
  const { activeProject } = useProjects();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [customFields, setCustomFields] = useState<EntityFieldType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localCharacters, setLocalCharacters] = useState<Character[]>([]);

  // Update local state immediately for smooth typing
  const handleLocalUpdate = (id: string, field: string, value: string) => {
    setCharacters(prev => prev.map(char => 
      char.id === id 
        ? { ...char, [field]: value } 
        : char
    ));
  };

  // Debounced update to Firestore
  const debouncedUpdate = useCallback(
    debounce(async (id: string, field: string, value: string) => {
      try {
        await updateCharacter(id, { [field]: value });
      } catch (error) {
        console.error('Error updating character:', error);
        toast({
          title: "Error",
          description: "Failed to update character. Please try again.",
          variant: "destructive"
        });
      }
    }, 1000), // Wait 1 second after last keystroke before saving
    [toast]
  );

  const handleUpdateCharacter = async (id: string, field: string, value: string) => {
    // Update local state immediately
    handleLocalUpdate(id, field, value);
    // Debounce the Firestore update
    debouncedUpdate(id, field, value);
  };

  // Load characters and custom fields
  useEffect(() => {
    async function loadData() {
      if (!activeProject?.id) return;
      
      try {
        setIsLoading(true);
        const [loadedCharacters, loadedFields] = await Promise.all([
          getCharacters(activeProject.id),
          getCustomFields(activeProject.id, COLLECTIONS.characters)
        ]);
        
        // If no characters exist, use sample characters
        if (loadedCharacters.length === 0) {
          // Add projectId to sample characters
          const sampleWithProject = SAMPLE_CHARACTERS.map(char => ({
            ...char,
            projectId: activeProject.id
          }));
          setCharacters(sampleWithProject);
        } else {
          setCharacters(loadedCharacters);
        }
        
        // Set default custom fields if none exist
        if (loadedFields.length === 0) {
          const defaultFields: EntityFieldType[] = [
            { id: 'sample-1', key: 'role', label: 'Role', type: 'input' },
            { id: 'sample-2', key: 'age', label: 'Age', type: 'input' },
            { id: 'sample-3', key: 'occupation', label: 'Occupation', type: 'input' },
            { id: 'sample-4', key: 'goals', label: 'Goals', type: 'textarea' }
          ];
          setCustomFields(defaultFields);
        } else {
          setCustomFields(loadedFields);
        }
      } catch (error) {
        console.error('Error loading characters:', error);
        // On error, use sample data
        setCharacters(SAMPLE_CHARACTERS);
        setCustomFields([
          { id: 'sample-1', key: 'role', label: 'Role', type: 'input' },
          { id: 'sample-2', key: 'age', label: 'Age', type: 'input' },
          { id: 'sample-3', key: 'occupation', label: 'Occupation', type: 'input' },
          { id: 'sample-4', key: 'goals', label: 'Goals', type: 'textarea' }
        ]);
        toast({
          title: "Error",
          description: "Failed to load characters. Using sample data instead.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [activeProject?.id, toast]);

  const handleAddCharacter = async () => {
    if (!activeProject?.id) return;
    
    try {
      const newCharacter = await addCharacter(activeProject.id, {
        name: 'New Character',
        description: '',
      });
      
      setCharacters(prev => [...prev, newCharacter]);
    } catch (error) {
      console.error('Error adding character:', error);
      toast({
        title: "Error",
        description: "Failed to add character. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteCharacter = async (id: string) => {
    try {
      await deleteCharacter(id);
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddCustomField = async (field: EntityFieldType) => {
    if (!activeProject?.id) return;
    
    try {
      const newField = await addCustomField(
        activeProject.id,
        COLLECTIONS.characters,
        field
      );
      
      setCustomFields(prev => [...prev, newField]);
      
      // Add the field to each character with an empty value
      setCharacters(prev => prev.map(char => ({
        ...char,
        [field.key]: '',
      })));
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Error",
        description: "Failed to add custom field. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveCustomField = async (key: string) => {
    if (!activeProject?.id) return;
    
    try {
      const fieldToDelete = customFields.find(f => f.key === key);
      if (!fieldToDelete?.id) return;
      
      await deleteCustomField(fieldToDelete.id);
      
      setCustomFields(prev => prev.filter(field => field.key !== key));
      
      // Remove the field from each character
      setCharacters(prev => prev.map(char => {
        const newChar = { ...char };
        delete newChar[key];
        return newChar;
      }));
    } catch (error) {
      console.error('Error removing custom field:', error);
      toast({
        title: "Error",
        description: "Failed to remove custom field. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (!activeProject) {
    return <div className="p-4 text-muted-foreground">Please select a project first.</div>;
  }
  
  return (
    <EntityPanel
      title="Characters"
      icon={User}
      entities={characters}
      defaultFields={customFields}
      onAdd={handleAddCharacter}
      onUpdate={handleUpdateCharacter}
      onDelete={handleDeleteCharacter}
      onAddField={handleAddCustomField}
      onRemoveField={handleRemoveCustomField}
      isLoading={isLoading}
    />
  );
}