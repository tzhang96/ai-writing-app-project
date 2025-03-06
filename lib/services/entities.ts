import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const COLLECTIONS = {
  characters: 'characters',
  locations: 'locations',
  events: 'events',
  customFields: 'customFields',
  style: 'style',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export interface EntityField {
  id?: string;
  key: string;
  label: string;
  type: 'input' | 'textarea';
  placeholder?: string;
  isDefault?: boolean;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface Location {
  id: string;
  projectId: string;
  name: string;
  description: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface Event {
  id: string;
  projectId: string;
  title: string;
  description: string;
  sequence: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface StyleExample {
  id: string;
  title: string;
  content: string;
}

export interface Style {
  id: string;
  projectId: string;
  voice: string;
  pov: string;
  tense: string;
  dialogue: string;
  examples: StyleExample[];
  createdAt?: any;
  updatedAt?: any;
}

interface CharacterRelationship {
  targetName: string;
  type: string;
  description: string;
}

interface LocationCharacterConnection {
  characterName: string;
  connection: string;
}

interface ExtendedCharacter extends Character {
  aliases?: string[];
  attributes?: {
    personality?: string[];
    appearance?: string[];
    background?: string[];
  };
  relationships?: string; // Stored as formatted string
  relationshipData?: CharacterRelationship[]; // Stored as structured data
  personality?: string;
  appearance?: string;
  background?: string;
}

interface ExtendedLocation extends Location {
  attributes?: {
    type?: string;
    features?: string[];
    significance?: string[];
    associatedCharacters?: string[];
  };
  characterConnections?: LocationCharacterConnection[];
  locationType?: string;
  features?: string;
  significance?: string;
}

// Get all characters for a project
export async function getCharacters(projectId: string): Promise<Character[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.characters),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Character[];
  } catch (error) {
    console.error('Error getting characters:', error);
    throw error;
  }
}

// Add a new character
export async function addCharacter(projectId: string, character: Omit<Character, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Character> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.characters), {
      ...character,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newCharacter = await getDoc(docRef);
    const data = newCharacter.data();
    
    if (!data) {
      throw new Error('Failed to create character');
    }
    
    return {
      id: docRef.id,
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ...data // Include any custom fields
    } as Character;
  } catch (error) {
    console.error('Error adding character:', error);
    throw error;
  }
}

// Update a character
export async function updateCharacter(characterId: string, updates: Partial<Character>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.characters, characterId);
    
    // Remove id and projectId from updates to prevent overwriting
    const { id, projectId, ...safeUpdates } = updates;
    
    await updateDoc(docRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating character:', error);
    throw error;
  }
}

// Delete a character
export async function deleteCharacter(characterId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.characters, characterId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting character:', error);
    throw error;
  }
}

// Get all locations for a project
export async function getLocations(projectId: string): Promise<Location[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.locations),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
  } catch (error) {
    console.error('Error getting locations:', error);
    throw error;
  }
}

// Add a new location
export async function addLocation(projectId: string, location: Omit<Location, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Location> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.locations), {
      ...location,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newLocation = await getDoc(docRef);
    const data = newLocation.data();
    
    if (!data) {
      throw new Error('Failed to create location');
    }
    
    return {
      id: docRef.id,
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ...data // Include any custom fields
    } as Location;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
}

// Update a location
export async function updateLocation(locationId: string, updates: Partial<Location>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.locations, locationId);
    
    // Remove id and projectId from updates to prevent overwriting
    const { id, projectId, ...safeUpdates } = updates;
    
    await updateDoc(docRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// Delete a location
export async function deleteLocation(locationId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.locations, locationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

// Get all events for a project
export async function getEvents(projectId: string): Promise<Event[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.events),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
    
    // Sort by sequence
    return events.sort((a, b) => a.sequence - b.sequence);
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

// Add a new event
export async function addEvent(projectId: string, event: Omit<Event, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Event> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.events), {
      ...event,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newEvent = await getDoc(docRef);
    const data = newEvent.data();
    
    if (!data) {
      throw new Error('Failed to create event');
    }
    
    return {
      id: docRef.id,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      sequence: data.sequence,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ...data // Include any custom fields
    } as Event;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

// Update an event
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.events, eventId);
    
    // Remove id and projectId from updates to prevent overwriting
    const { id, projectId, ...safeUpdates } = updates;
    
    await updateDoc(docRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.events, eventId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Get custom fields for a project and collection
export async function getCustomFields(projectId: string, collectionName: CollectionName): Promise<EntityField[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.customFields),
      where('projectId', '==', projectId),
      where('collectionName', '==', collectionName)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as EntityField));
  } catch (error) {
    console.error('Error getting custom fields:', error);
    throw error;
  }
}

// Add a custom field
export async function addCustomField(
  projectId: string, 
  collectionName: CollectionName,
  field: Omit<EntityField, 'id'>
): Promise<EntityField> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.customFields), {
      ...field,
      projectId,
      collectionName,
      createdAt: serverTimestamp(),
    });
    
    const newField = await getDoc(docRef);
    return {
      ...newField.data(),
      id: docRef.id,
    } as EntityField;
  } catch (error) {
    console.error('Error adding custom field:', error);
    throw error;
  }
}

// Delete a custom field
export async function deleteCustomField(fieldId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.customFields, fieldId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting custom field:', error);
    throw error;
  }
}

// Get style for a project
export async function getStyle(projectId: string): Promise<Style | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.style),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const styles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Style[];
    
    return styles.length > 0 ? styles[0] : null;
  } catch (error) {
    console.error('Error getting style:', error);
    throw error;
  }
}

// Add or update style
export async function saveStyle(projectId: string, style: Omit<Style, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>): Promise<Style> {
  try {
    // First check if a style document already exists for this project
    const existingStyle = await getStyle(projectId);
    
    if (existingStyle) {
      // Update existing style
      const docRef = doc(db, COLLECTIONS.style, existingStyle.id);
      await updateDoc(docRef, {
        ...style,
        updatedAt: serverTimestamp(),
      });
      
      return {
        ...style,
        id: existingStyle.id,
        projectId,
        createdAt: existingStyle.createdAt,
        updatedAt: serverTimestamp(),
      };
    } else {
      // Create new style
      const docRef = await addDoc(collection(db, COLLECTIONS.style), {
        ...style,
        projectId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const newStyle = await getDoc(docRef);
      const data = newStyle.data();
      
      if (!data) {
        throw new Error('Failed to create style');
      }
      
      return {
        id: docRef.id,
        projectId: data.projectId,
        voice: data.voice,
        pov: data.pov,
        tense: data.tense,
        dialogue: data.dialogue,
        examples: data.examples,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Style;
    }
  } catch (error) {
    console.error('Error saving style:', error);
    throw error;
  }
}

// Delete style
export async function deleteStyle(styleId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.style, styleId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting style:', error);
    throw error;
  }
}

interface EntityToSave {
  type: 'character' | 'location' | 'event';
  data: any;
  existingEntity?: ExtendedCharacter | ExtendedLocation;
}

// Helper function to ensure custom fields exist
async function ensureCustomFields(
  projectId: string, 
  collectionName: CollectionName,
  fields: { key: string; label: string; type: 'input' | 'textarea' }[]
): Promise<void> {
  const existingFields = await getCustomFields(projectId, collectionName);
  const existingKeys = new Set(existingFields.map(f => f.key));
  
  const newFields = fields.filter(f => !existingKeys.has(f.key));
  
  // Create all new fields in parallel
  await Promise.all(
    newFields.map(field => 
      addCustomField(projectId, collectionName, {
        ...field,
        isDefault: false
      })
    )
  );
}

// Helper function to merge arrays without duplicates and filter out existing values
function mergeArrays(existing: string[] = [], incoming: string[] = []): { merged: string[], newItems: string[] } {
  const existingSet = new Set(existing);
  const newItems = incoming.filter(item => !existingSet.has(item));
  return {
    merged: Array.from(new Set([...existing, ...newItems])),
    newItems
  };
}

// Helper function to merge character attributes
function mergeCharacterAttributes(existing: any = {}, incoming: any = {}) {
  const personality = mergeArrays(
    existing.personality || [], 
    incoming.personality || []
  );
  const appearance = mergeArrays(
    existing.appearance || [], 
    incoming.appearance || []
  );
  const background = mergeArrays(
    existing.background || [], 
    incoming.background || []
  );

  return {
    merged: {
      personality: personality.merged,
      appearance: appearance.merged,
      background: background.merged
    },
    newItems: {
      personality: personality.newItems,
      appearance: appearance.newItems,
      background: background.newItems
    }
  };
}

// Helper function to merge location attributes
function mergeLocationAttributes(existing: any = {}, incoming: any = {}) {
  const features = mergeArrays(
    existing.features || [], 
    incoming.features || []
  );
  const significance = mergeArrays(
    existing.significance || [], 
    incoming.significance || []
  );
  const associatedCharacters = mergeArrays(
    existing.associatedCharacters || [], 
    incoming.associatedCharacters || []
  );

  return {
    merged: {
      type: incoming.type || existing.type || '',
      features: features.merged,
      significance: significance.merged,
      associatedCharacters: associatedCharacters.merged
    },
    newItems: {
      type: incoming.type !== existing.type ? incoming.type : null,
      features: features.newItems,
      significance: significance.newItems,
      associatedCharacters: associatedCharacters.newItems
    }
  };
}

// Helper function to find existing entity
export async function findExistingEntity(projectId: string, type: 'character' | 'location', name: string): Promise<ExtendedCharacter | ExtendedLocation | null> {
  const collectionName = type === 'character' ? COLLECTIONS.characters : COLLECTIONS.locations;
  const q = query(
    collection(db, collectionName),
    where('projectId', '==', projectId),
    where('name', '==', name)
  );
  const querySnapshot = await getDocs(q);
  const matches = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return matches.length > 0 ? matches[0] as (ExtendedCharacter | ExtendedLocation) : null;
}

// Save multiple entities at once
export async function saveEntities(projectId: string, entities: EntityToSave[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // If we have any events to save, get the current highest sequence number
    const eventsToSave = entities.filter(e => e.type === 'event');
    let nextSequence = 0;
    
    if (eventsToSave.length > 0) {
      const currentEvents = await getEvents(projectId);
      nextSequence = currentEvents.length > 0 
        ? Math.max(...currentEvents.map(e => e.sequence)) + 1 
        : 0;
    }
    
    // First, check for existing entities
    const entitiesWithExisting = await Promise.all(
      entities.map(async (entity) => {
        if (entity.type === 'character' || entity.type === 'location') {
          const existing = await findExistingEntity(projectId, entity.type, entity.data.name);
          return { ...entity, existingEntity: existing };
        }
        return entity;
      })
    );
    
    for (const entity of entitiesWithExisting) {
      const collectionName = entity.type === 'character' ? 'characters' :
                           entity.type === 'location' ? 'locations' :
                           'events';
      
      let processedData: any = { ...entity.data };
      let docRef: any;
      
      if (entity.type === 'character') {
        const existingCharacter = entity.existingEntity as ExtendedCharacter | undefined;
        
        if (existingCharacter) {
          // Use existing document reference
          docRef = doc(collection(db, collectionName), existingCharacter.id);
          
          // Create custom fields for character attributes if they exist
          const customFieldsToCreate = [];
          
          if (entity.data.attributes) {
            if (entity.data.attributes.personality?.length > 0) {
              customFieldsToCreate.push({
                key: 'personality',
                label: 'Personality',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.personality?.split(', ') || [],
                entity.data.attributes.personality
              );
              processedData.personality = merged.join(', ');
            }
            
            if (entity.data.attributes.appearance?.length > 0) {
              customFieldsToCreate.push({
                key: 'appearance',
                label: 'Appearance',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.appearance?.split(', ') || [],
                entity.data.attributes.appearance
              );
              processedData.appearance = merged.join(', ');
            }
            
            if (entity.data.attributes.background?.length > 0) {
              customFieldsToCreate.push({
                key: 'background',
                label: 'Background',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.background?.split('. ') || [],
                entity.data.attributes.background
              );
              processedData.background = merged.join('. ');
            }
          }
          
          // Add relationships custom field if there are relationships
          if (entity.data.relationships?.length > 0) {
            customFieldsToCreate.push({
              key: 'relationships',
              label: 'Relationships',
              type: 'textarea' as const
            });
            
            // Format new relationships into a readable string
            const relationshipStrings = entity.data.relationships.map((rel: CharacterRelationship) => 
              `${rel.targetName} - ${rel.type}: ${rel.description}`
            );
            
            // Handle existing relationships - split by newlines if it exists
            const existingRelationshipStrings = existingCharacter.relationships ? 
              existingCharacter.relationships.split('\n') : 
              [];
            
            const { merged: mergedRelationships } = mergeArrays(
              existingRelationshipStrings,
              relationshipStrings
            );
            
            processedData.relationships = mergedRelationships.join('\n');

            // Store the structured relationship data separately
            const existingRelData = existingCharacter.relationshipData || [];
            const newRelData = entity.data.relationships.filter(newRel => 
              !existingRelData.some(existingRel => 
                existingRel.targetName === newRel.targetName && 
                existingRel.type === newRel.type && 
                existingRel.description === newRel.description
              )
            );
            
            processedData.relationshipData = [
              ...existingRelData,
              ...newRelData
            ];
          }
          
          if (customFieldsToCreate.length > 0) {
            await ensureCustomFields(projectId, COLLECTIONS.characters, customFieldsToCreate);
          }
          
          // Merge character data
          processedData = {
            ...processedData,
            name: entity.data.name,
            description: entity.data.description || existingCharacter.description || '',
            aliases: mergeArrays(existingCharacter.aliases, entity.data.aliases),
            attributes: mergeCharacterAttributes(existingCharacter.attributes, entity.data.attributes),
            relationshipData: [...(existingCharacter.relationshipData || []), ...(entity.data.relationships || [])]
          };
          
          // Update the existing document
          batch.update(docRef, {
            ...processedData,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new document for non-existing character
          docRef = doc(collection(db, collectionName));
          
          // Handle new character creation
          const customFieldsToCreate = [];
          
          if (entity.data.attributes) {
            if (entity.data.attributes.personality?.length > 0) {
              customFieldsToCreate.push({
                key: 'personality',
                label: 'Personality',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.personality?.split(', ') || [],
                entity.data.attributes.personality
              );
              processedData.personality = merged.join(', ');
            }
            
            if (entity.data.attributes.appearance?.length > 0) {
              customFieldsToCreate.push({
                key: 'appearance',
                label: 'Appearance',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.appearance?.split(', ') || [],
                entity.data.attributes.appearance
              );
              processedData.appearance = merged.join(', ');
            }
            
            if (entity.data.attributes.background?.length > 0) {
              customFieldsToCreate.push({
                key: 'background',
                label: 'Background',
                type: 'textarea' as const
              });
              const { merged } = mergeArrays(
                existingCharacter.background?.split('. ') || [],
                entity.data.attributes.background
              );
              processedData.background = merged.join('. ');
            }
          }

          // Add relationships custom field if there are relationships
          if (entity.data.relationships?.length > 0) {
            customFieldsToCreate.push({
              key: 'relationships',
              label: 'Relationships',
              type: 'textarea' as const
            });
            
            // Format new relationships into a readable string
            const relationshipStrings = entity.data.relationships.map((rel: CharacterRelationship) => 
              `${rel.targetName} - ${rel.type}: ${rel.description}`
            );
            
            processedData.relationships = relationshipStrings.join('\n');
            processedData.relationshipData = entity.data.relationships;
          }
          
          if (customFieldsToCreate.length > 0) {
            await ensureCustomFields(projectId, COLLECTIONS.characters, customFieldsToCreate);
          }
          
          // Set the new document
          batch.set(docRef, {
            ...processedData,
            projectId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else if (entity.type === 'location') {
        const existingLocation = entity.existingEntity as ExtendedLocation | undefined;
        
        if (existingLocation) {
          // Use existing document reference
          docRef = doc(collection(db, collectionName), existingLocation.id);
          
          // Create custom fields for location attributes if they exist
          const customFieldsToCreate = [];
          
          if (entity.data.attributes) {
            if (entity.data.attributes.type) {
              customFieldsToCreate.push({
                key: 'locationType',
                label: 'Type',
                type: 'input' as const
              });
              processedData.locationType = entity.data.attributes.type;
            }
            
            if (entity.data.attributes.features?.length > 0) {
              customFieldsToCreate.push({
                key: 'features',
                label: 'Features',
                type: 'textarea' as const
              });
              processedData.features = mergeArrays(
                existingLocation.features?.split(', ') || [],
                entity.data.attributes.features
              ).join(', ');
            }
            
            if (entity.data.attributes.significance?.length > 0) {
              customFieldsToCreate.push({
                key: 'significance',
                label: 'Significance',
                type: 'textarea' as const
              });
              processedData.significance = mergeArrays(
                existingLocation.significance?.split('. ') || [],
                entity.data.attributes.significance
              ).join('. ');
            }
          }
          
          // Merge location data
          processedData = {
            ...processedData,
            name: entity.data.name,
            description: entity.data.description || existingLocation.description || '',
            attributes: mergeLocationAttributes(existingLocation.attributes, entity.data.attributes),
            characterConnections: [...(existingLocation.characterConnections || []), ...(entity.data.characterConnections || [])]
          };
          
          // Update the existing document
          batch.update(docRef, {
            ...processedData,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new document for non-existing location
          docRef = doc(collection(db, collectionName));
          
          // Handle new location creation
          if (entity.data.attributes) {
            const customFieldsToCreate = [];
            
            if (entity.data.attributes.type) {
              customFieldsToCreate.push({
                key: 'locationType',
                label: 'Type',
                type: 'input' as const
              });
              processedData.locationType = entity.data.attributes.type;
            }
            
            if (entity.data.attributes.features?.length > 0) {
              customFieldsToCreate.push({
                key: 'features',
                label: 'Features',
                type: 'textarea' as const
              });
              processedData.features = entity.data.attributes.features.join(', ');
            }
            
            if (entity.data.attributes.significance?.length > 0) {
              customFieldsToCreate.push({
                key: 'significance',
                label: 'Significance',
                type: 'textarea' as const
              });
              processedData.significance = entity.data.attributes.significance.join('. ');
            }
            
            if (customFieldsToCreate.length > 0) {
              await ensureCustomFields(projectId, COLLECTIONS.locations, customFieldsToCreate);
            }
          }
          
          // Set the new document
          batch.set(docRef, {
            ...processedData,
            projectId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Handle events (no merging needed, always create new)
        docRef = doc(collection(db, collectionName));
        processedData = {
          ...entity.data,
          sequence: nextSequence++
        };
        
        batch.set(docRef, {
          ...processedData,
          projectId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error saving entities:', error);
    throw error;
  }
} 