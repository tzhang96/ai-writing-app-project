"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectHeader } from '@/components/projects/project-header';

interface Project {
  id: string;
  title: string;
  description: string;
  lastEdited: Date;
  coverImage?: string;
}

// Sample project data
const sampleProjects: Project[] = [
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

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load projects from localStorage on component mount
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
          setProjects(sampleProjects);
        }
      } else {
        // Use sample projects if nothing in localStorage
        setProjects(sampleProjects);
      }
      setIsLoading(false);
    };
    
    loadProjects();
  }, []);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('scribe-projects', JSON.stringify(projects));
    }
  }, [projects, isLoading]);
  
  const handleCreateProject = () => {
    if (newProject.title.trim() === '') return;
    
    const project: Project = {
      id: `project-${Date.now()}`,
      title: newProject.title,
      description: newProject.description,
      lastEdited: new Date()
    };
    
    setProjects([...projects, project]);
    setNewProject({ title: '', description: '' });
    setOpen(false);
  };
  
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjects(projects.filter(project => project.id !== id));
  };
  
  return (
    <div className="flex flex-col h-screen">
      <ProjectHeader />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-6">Your Projects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Project Card */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Card className="h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle className="text-xl text-muted-foreground">Create New Project</CardTitle>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Give your project a name and description to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectTitle">Project Title</Label>
                    <Input 
                      id="projectTitle" 
                      placeholder="Enter a title..." 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Description</Label>
                    <Input 
                      id="projectDescription" 
                      placeholder="Enter a description..." 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Project Cards */}
            {projects.map((project) => (
              <Link 
                href={`/project/${project.id}`} 
                key={project.id}
                className="block"
              >
                <Card className="h-64 overflow-hidden group relative hover:shadow-md transition-shadow">
                  {project.coverImage && (
                    <div className="absolute inset-0 bg-cover bg-center z-0" style={{ 
                      backgroundImage: `url(${project.coverImage})`,
                      opacity: 0.2
                    }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-0" />
                  <div className="relative z-10 h-full flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{project.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardHeader>
                    <CardFooter className="mt-auto">
                      <p className="text-sm text-muted-foreground">
                        Last edited on {format(project.lastEdited, 'MMM d, yyyy')}
                      </p>
                    </CardFooter>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 