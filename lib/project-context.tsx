"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Project } from './project-context';
import { getProject } from './services/projects';

// Import sample projects directly to avoid circular dependency
const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'project-1',
    title: 'The Lost Kingdom',
    description: 'A fantasy novel about a hidden kingdom discovered by a young explorer.',
    lastEdited: new Date('2023-12-15'),
    coverImage: 'https://images.unsplash.com/photo-1518674660708-0e2c0473e68e?q=80&w=2574&auto=format&fit=crop'
  },
  {
    id: 'project-2',
    title: 'Silicon Valley: Uncovered',
    description: 'A tech thriller exploring the dark side of startup culture.',
    lastEdited: new Date('2024-01-20'),
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop'
  },
  {
    id: 'project-3',
    title: 'Echoes of Tomorrow',
    description: 'A sci-fi adventure set in a post-apocalyptic world.',
    lastEdited: new Date('2024-02-10'),
    coverImage: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=2564&auto=format&fit=crop'
  }
];

interface ProjectsContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  getProjectById: (id: string) => Promise<Project | null>;
}

const ProjectsContext = createContext<ProjectsContextType>({
  activeProject: null,
  setActiveProject: () => {},
  getProjectById: async () => null,
});

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const getProjectById = async (id: string): Promise<Project | null> => {
    // First check sample projects
    const sampleProject = SAMPLE_PROJECTS.find(p => p.id === id);
    if (sampleProject) {
      return sampleProject;
    }

    // Then try Firebase
    try {
      const project = await getProject(id);
      return project;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  };

  return (
    <ProjectsContext.Provider value={{ activeProject, setActiveProject, getProjectById }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectsContext); 