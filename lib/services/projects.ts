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
import { Project, ProjectData } from '@/lib/project-context';

export function getUserNotesCollection(userId: string) {
  return collection(db, 'users', userId, 'notes');
}

export async function createProject(userId: string, project: Omit<Project, 'id'>): Promise<Project> {
  try {
    const notesCollection = getUserNotesCollection(userId);
    const projectData: ProjectData = {
      ...project,
      userId,
    };
    
    const docRef = await addDoc(notesCollection, {
      ...projectData,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
    });
    
    return {
      id: docRef.id,
      ...project,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(userId: string, projectId: string, data: Partial<Project>) {
  try {
    const projectRef = doc(getUserNotesCollection(userId), projectId);
    await updateDoc(projectRef, {
      ...data,
      lastEdited: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(userId: string, projectId: string) {
  try {
    const projectRef = doc(getUserNotesCollection(userId), projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(getUserNotesCollection(userId), projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      return {
        id: projectSnap.id,
        title: data.title,
        description: data.description,
        lastEdited: data.lastEdited.toDate(),
        coverImage: data.coverImage,
        createdAt: data.createdAt?.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const notesCollection = getUserNotesCollection(userId);
    const querySnapshot = await getDocs(notesCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        lastEdited: data.lastEdited.toDate(),
        coverImage: data.coverImage,
        createdAt: data.createdAt?.toDate(),
      };
    });
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
} 