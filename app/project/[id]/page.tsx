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

type ProjectPageProps = {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ 
  params 
}: ProjectPageProps) {
  // The project existence check will happen in the WritingApp component
  // If the project doesn't exist, it will redirect to the home page
  const { id } = await params;
  return <WritingApp projectId={id} />;
} 