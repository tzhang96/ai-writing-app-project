"use client";

import { useState, useEffect } from 'react';
import { Map } from 'lucide-react';
import { EntityPanel } from './entity-panel';
import { useProjects } from '@/lib/project-context';
import { useToast } from '@/hooks/use-toast';
import { 
  getLocations, 
  addLocation, 
  updateLocation, 
  deleteLocation, 
  getCustomFields, 
  addCustomField, 
  deleteCustomField,
  COLLECTIONS,
  type Location,
  type EntityField
} from '@/lib/services/entities';

const SAMPLE_LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Main City',
    description: 'The primary urban setting of your story.',
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Forest',
    description: 'A mysterious woodland area.',
    projectId: '', // Will be set when used
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

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

export function WorldTab({ aiScribeEnabled }: { aiScribeEnabled: boolean }) {
  const { activeProject } = useProjects();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [customFields, setCustomFields] = useState<EntityField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load locations and custom fields
  useEffect(() => {
    async function loadData() {
      if (!activeProject?.id) return;
      
      try {
        setIsLoading(true);
        const [loadedLocations, loadedFields] = await Promise.all([
          getLocations(activeProject.id),
          getCustomFields(activeProject.id, COLLECTIONS.locations)
        ]);
        
        // If no locations exist, use sample locations
        if (loadedLocations.length === 0) {
          // Add projectId to sample locations
          const sampleWithProject = SAMPLE_LOCATIONS.map(loc => ({
            ...loc,
            projectId: activeProject.id
          }));
          setLocations(sampleWithProject);
        } else {
          setLocations(loadedLocations);
        }
        
        // Set default custom fields if none exist
        if (loadedFields.length === 0) {
          const defaultFields: EntityField[] = [
            { id: 'sample-1', key: 'climate', label: 'Climate', type: 'input' },
            { id: 'sample-2', key: 'population', label: 'Population', type: 'input' },
            { id: 'sample-3', key: 'significance', label: 'Significance', type: 'textarea' }
          ];
          setCustomFields(defaultFields);
        } else {
          setCustomFields(loadedFields);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
        // On error, use sample data
        setLocations(SAMPLE_LOCATIONS);
        setCustomFields([
          { id: 'sample-1', key: 'climate', label: 'Climate', type: 'input' },
          { id: 'sample-2', key: 'population', label: 'Population', type: 'input' },
          { id: 'sample-3', key: 'significance', label: 'Significance', type: 'textarea' }
        ]);
        toast({
          title: "Error",
          description: "Failed to load locations. Using sample data instead.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [activeProject?.id, toast]);

  const handleAddLocation = async () => {
    if (!activeProject?.id) return;
    
    try {
      const newLocation = await addLocation(activeProject.id, {
        name: 'New Location',
        description: '',
      });
      
      setLocations(prev => [...prev, newLocation]);
    } catch (error) {
      console.error('Error adding location:', error);
      toast({
        title: "Error",
        description: "Failed to add location. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteLocation = async (id: string) => {
    try {
      await deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Debounced update function
  const debouncedUpdate = debounce(async (id: string, updates: Partial<Location>) => {
    try {
      await updateLocation(id, updates);
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  }, 1000);

  const handleUpdateLocation = (id: string, field: string, value: string) => {
    // Update local state immediately
    setLocations(prev => prev.map(loc => 
      loc.id === id 
        ? { ...loc, [field]: value } 
        : loc
    ));
    
    // Debounced update to Firestore
    debouncedUpdate(id, { [field]: value });
  };

  const handleAddCustomField = async (field: EntityField) => {
    if (!activeProject?.id) return;
    
    try {
      const newField = await addCustomField(activeProject.id, COLLECTIONS.locations, field);
      setCustomFields(prev => [...prev, newField]);
      
      // Add the field to each location with an empty value
      setLocations(prev => prev.map(loc => ({
        ...loc,
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
    try {
      const fieldToDelete = customFields.find(f => f.key === key);
      if (fieldToDelete?.id) {
        await deleteCustomField(fieldToDelete.id);
      }
      
      setCustomFields(prev => prev.filter(f => f.key !== key));
      
      // Remove the field from each location
      setLocations(prev => prev.map(loc => {
        const newLoc = { ...loc };
        delete newLoc[key];
        return newLoc;
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
  
  return (
    <EntityPanel
      title="Locations"
      icon={Map}
      entities={locations}
      defaultFields={customFields}
      onAdd={handleAddLocation}
      onUpdate={handleUpdateLocation}
      onDelete={handleDeleteLocation}
      onAddField={handleAddCustomField}
      onRemoveField={handleRemoveCustomField}
      isLoading={isLoading}
    />
  );
}