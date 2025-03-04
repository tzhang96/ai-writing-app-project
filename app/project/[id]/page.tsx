import { WritingApp } from '@/components/writing-app';
import { notFound } from 'next/navigation';

// Sample project IDs - these match our initial sample projects
const sampleProjectIds = ['project-1', 'project-2', 'project-3'];

export function generateStaticParams() {
  // Return an array of possible values for [id]
  return sampleProjectIds.map((id) => ({
    id: id,
  }));
}

export default async function ProjectPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // The project existence check will happen in the WritingApp component
  // If the project doesn't exist, it will redirect to the home page
  const projectId = params.id;
  return <WritingApp projectId={projectId} />;
} 