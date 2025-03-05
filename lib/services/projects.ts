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
    console.log('getAllProjects: Starting to fetch projects from Firestore');
    const projectsCollection = getProjectsCollection();
    const querySnapshot = await getDocs(projectsCollection);
    
    console.log(`getAllProjects: Retrieved ${querySnapshot.docs.length} documents`);
    
    const projects: Project[] = [];
    
    for (const doc of querySnapshot.docs) {
      try {
        const data = doc.data();
        console.log(`Processing document ${doc.id}:`, data);
        
        // Skip documents with missing required fields
        if (!data.title || !data.description) {
          console.warn(`Skipping document ${doc.id} due to missing required fields`);
          continue;
        }
        
        // Handle missing or invalid timestamps
        let lastEdited: Date;
        let createdAt: Date | undefined;
        
        try {
          lastEdited = data.lastEdited?.toDate() || new Date();
        } catch (err) {
          console.warn(`Invalid lastEdited timestamp for document ${doc.id}, using current date`);
          lastEdited = new Date();
        }
        
        try {
          createdAt = data.createdAt?.toDate();
        } catch (err) {
          console.warn(`Invalid createdAt timestamp for document ${doc.id}`);
          createdAt = undefined;
        }
        
        projects.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          lastEdited,
          coverImage: data.coverImage,
          createdAt
        });
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        // Continue with other documents
      }
    }
    
    console.log('getAllProjects: Successfully processed all documents', projects);
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    // Return empty array instead of throwing
    return [];
  }
} 