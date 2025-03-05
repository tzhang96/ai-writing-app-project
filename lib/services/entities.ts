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