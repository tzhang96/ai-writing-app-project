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

export interface Brainstorm {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
}

const COLLECTION_NAME = 'brainstorms';

// Get all brainstorms for a project
export async function getBrainstorms(projectId: string): Promise<Brainstorm[]> {
  try {
    const brainstormsQuery = query(
      collection(db, COLLECTION_NAME),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(brainstormsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as Brainstorm));
  } catch (error) {
    console.error('Error getting brainstorms:', error);
    throw error;
  }
}

// Create a new brainstorm
export async function createBrainstorm(projectId: string, title: string, content: string = ''): Promise<Brainstorm> {
  try {
    const brainstormData = {
      projectId,
      title,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), brainstormData);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    if (!data) {
      throw new Error('Failed to create brainstorm');
    }
    
    return {
      id: docRef.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Brainstorm;
  } catch (error) {
    console.error('Error creating brainstorm:', error);
    throw error;
  }
}

// Update a brainstorm
export async function updateBrainstorm(brainstormId: string, updates: Partial<Omit<Brainstorm, 'id' | 'projectId'>>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, brainstormId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating brainstorm:', error);
    throw error;
  }
}

// Delete a brainstorm
export async function deleteBrainstorm(brainstormId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, brainstormId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting brainstorm:', error);
    throw error;
  }
} 