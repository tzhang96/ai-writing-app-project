import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project } from '@/lib/project-context';

// Use a single collection for all projects
export function getProjectsCollection() {
  return collection(db, 'projects');
}

export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  try {
    const projectsCollection = getProjectsCollection();
    
    // Create the project document with required fields
    const projectData = {
      title: project.title,
      description: project.description,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add coverImage if it exists
    if (project.coverImage) {
      Object.assign(projectData, { coverImage: project.coverImage });
    }
    
    // Create the project document
    const docRef = await addDoc(projectsCollection, projectData);
    
    // Get the created document to return with server timestamps
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    if (!data) {
      throw new Error('Failed to create project');
    }
    
    // Return the project with the correct timestamp
    return {
      id: docRef.id,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage || undefined,
      lastEdited: data.lastEdited.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate(),
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(projectId: string, data: Partial<Project>) {
  try {
    const projectRef = doc(getProjectsCollection(), projectId);
    await updateDoc(projectRef, {
      ...data,
      lastEdited: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string) {
  try {
    const projectRef = doc(getProjectsCollection(), projectId);
    await deleteDoc(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(getProjectsCollection(), projectId);
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
        updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const projectsCollection = getProjectsCollection();
    const querySnapshot = await getDocs(projectsCollection);
    const projects = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        lastEdited: data.lastEdited.toDate(),
        coverImage: data.coverImage,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt?.toDate(),
      };
    });
    
    // Sort projects by lastEdited in descending order (most recent first)
    return projects.sort((a, b) => b.lastEdited.getTime() - a.lastEdited.getTime());
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
} 