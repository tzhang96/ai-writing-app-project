"use client";

import * as React from 'react';
import { SAMPLE_PROJECTS } from '@/components/projects/project-list';
import { getProject } from './services/projects';

export interface Project {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastEdited?: Date | string;
}

interface ProjectsContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  getProjectById: (id: string) => Promise<Project | null>;
}

const ProjectsContext = React.createContext<ProjectsContextType>({
  activeProject: null,
  setActiveProject: () => {},
  getProjectById: async () => null,
});

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProject] = React.useState<Project | null>(null);

  const getProjectById = async (id: string): Promise<Project | null> => {
    // First check sample projects
    const sampleProject = SAMPLE_PROJECTS.find(p => p.id === id);
    if (sampleProject) {
      return sampleProject;
    }

    // Then try to get from Firebase
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

export const useProjects = () => React.useContext(ProjectsContext); 