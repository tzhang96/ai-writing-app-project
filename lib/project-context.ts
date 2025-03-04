export interface Project {
  id: string;
  title: string;
  description: string;
  lastEdited: Date;
  coverImage?: string;
  createdAt?: Date;
}

export interface ProjectData extends Omit<Project, 'id'> {
  userId: string;
}

// Sample project data for development
export const sampleProjects: Project[] = [
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