"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { PlanningMode } from '@/components/planning-mode';
import { WritingMode } from '@/components/writing-mode';
import { useProjects } from '@/lib/project-context';
import { useRouter } from 'next/navigation';

export type Mode = 'planning' | 'writing';

export interface WritingAppProps {
  projectId: string;
}

export function WritingApp({ projectId }: WritingAppProps) {
  const [mode, setMode] = useState<Mode>('planning');
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(true);
  const { setActiveProject, getProjectById } = useProjects();
  const router = useRouter();
  
  // Load project data when projectId changes
  useEffect(() => {
    const project = getProjectById(projectId);
    
    if (project) {
      setActiveProject(project);
      // Update last edited time
      const updatedProject = {
        ...project,
        lastEdited: new Date()
      };
      
      // Update in localStorage
      const savedProjects = localStorage.getItem('scribe-projects');
      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          const updatedProjects = projects.map((p: any) => 
            p.id === projectId ? updatedProject : p
          );
          localStorage.setItem('scribe-projects', JSON.stringify(updatedProjects));
        } catch (e) {
          console.error('Error updating project timestamp', e);
        }
      }
    } else {
      // Project not found, redirect to projects list
      router.push('/');
    }
  }, [projectId, getProjectById, setActiveProject, router]);
  
  return (
    <div className="flex flex-col h-screen">
      <Header 
        mode={mode} 
        setMode={setMode} 
        chatSidebarCollapsed={chatSidebarCollapsed} 
        setChatSidebarCollapsed={setChatSidebarCollapsed}
        projectId={projectId}
      />
      <div className="flex-1 overflow-hidden">
        {mode === 'planning' ? (
          <PlanningMode 
            chatSidebarCollapsed={chatSidebarCollapsed}
            projectId={projectId}
          />
        ) : (
          <WritingMode 
            chatSidebarCollapsed={chatSidebarCollapsed}
            projectId={projectId}
          />
        )}
      </div>
    </div>
  );
}