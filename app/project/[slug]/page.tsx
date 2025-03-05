"use client";

import { WritingApp } from '@/components/writing-app';
import { notFound, useParams } from 'next/navigation';
import { getAllProjects } from '@/lib/services/projects';
import { slugify } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Project } from '@/lib/project-context';
import { SAMPLE_PROJECTS } from '@/components/projects/project-list';

export default function ProjectPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function loadProject() {
      try {
        // First try to find in Firebase projects
        const firebaseProjects = await getAllProjects();
        let matchingProject = firebaseProjects.find(p => slugify(p.title) === slug);
        
        // If not found in Firebase, look in sample projects
        if (!matchingProject) {
          matchingProject = SAMPLE_PROJECTS.find(p => slugify(p.title) === slug);
        }
        
        if (!matchingProject) {
          console.log('Project not found for slug:', slug);
          notFound();
          return;
        }

        console.log('Found project:', matchingProject);
        setProject(matchingProject);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [slug]);

  if (!slug) {
    return notFound();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">Error loading project: {error.message}</div>
      </div>
    );
  }

  if (!project) {
    return notFound();
  }

  return <WritingApp projectId={project.id} />;
} 