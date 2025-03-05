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
  const [loading, setLoading] = useState(true);
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
  const [aiScribeEnabled, setAiScribeEnabled] = useState(true);
  const { setActiveProject, getProjectById } = useProjects();
  const router = useRouter();
  const [projectTitle, setProjectTitle] = useState<string | undefined>();
  
  // Load project data when projectId changes
  useEffect(() => {
    async function loadProject() {
      try {
        const project = await getProjectById(projectId);
        
        if (project) {
          setActiveProject(project);
          setProjectTitle(project.title);
          setLoading(false);
        } else {
          // Project not found, redirect to projects list
          console.log('Project not found, redirecting to home');
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        router.push('/');
      }
    }

    loadProject();
  }, [projectId, getProjectById, setActiveProject, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      <Header 
        mode={mode} 
        setMode={setMode} 
        chatSidebarCollapsed={chatSidebarCollapsed} 
        setChatSidebarCollapsed={setChatSidebarCollapsed}
        aiScribeEnabled={aiScribeEnabled}
        setAiScribeEnabled={setAiScribeEnabled}
        projectId={projectId}
        projectTitle={projectTitle}
      />
      <div className="flex-1 overflow-hidden">
        {mode === 'planning' ? (
          <PlanningMode 
            chatSidebarCollapsed={chatSidebarCollapsed}
            projectId={projectId}
            aiScribeEnabled={aiScribeEnabled}
          />
        ) : (
          <WritingMode 
            chatSidebarCollapsed={chatSidebarCollapsed}
            projectId={projectId}
            aiScribeEnabled={aiScribeEnabled}
          />
        )}
      </div>
    </div>
  );
}