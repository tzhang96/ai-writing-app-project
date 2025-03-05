"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Project } from './project-context';
import { SAMPLE_PROJECTS } from '@/components/projects/project-list';
import { getProject } from './services/projects';

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