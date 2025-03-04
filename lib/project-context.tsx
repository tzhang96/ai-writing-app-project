"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";

export interface Project {
  id: string;
  title: string;
  description: string;
  lastEdited: Date;
  coverImage?: string;
}

interface ProjectsContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  getProjectById: (id: string) => Project | null;
}

const ProjectsContext = createContext<ProjectsContextType>({
  activeProject: null,
  setActiveProject: () => {},
  getProjectById: () => null,
});

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load projects from localStorage on mount
  useEffect(() => {
    const loadProjects = () => {
      const savedProjects = localStorage.getItem('scribe-projects');
      if (savedProjects) {
        try {
          // Parse the JSON string and convert date strings to Date objects
          const parsed = JSON.parse(savedProjects, (key, value) => {
            // Convert string dates back to Date objects
            if (key === 'lastEdited' && typeof value === 'string') {
              return new Date(value);
            }
            return value;
          });
          setProjects(parsed);
        } catch (e) {
          console.error('Error loading projects', e);
          setProjects([]);
        }
      }
      setIsLoading(false);
    };
    
    loadProjects();
  }, []);
  
  const getProjectById = (id: string): Project | null => {
    if (!projects.length || !id) return null;
    return projects.find(project => project.id === id) || null;
  };
  
  return (
    <ProjectsContext.Provider value={{ activeProject, setActiveProject, getProjectById }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectsContext); 