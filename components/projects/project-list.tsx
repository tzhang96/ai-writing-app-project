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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectDialog, ProjectFormData } from '@/components/projects/project-dialog';
import { useFirebase } from '@/lib/firebase-context';
import { createProject, deleteProject, updateProject, getAllProjects } from '@/lib/services/projects';
import { Project } from '@/lib/project-context';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'project-1',
    title: 'The Lost Kingdom',
    description: 'A fantasy novel about a hidden kingdom discovered by a young explorer.',
    coverImage: 'https://images.unsplash.com/photo-1518674660708-0e2c0473e68e?q=80&w=2574&auto=format&fit=crop',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2023-12-15'),
  },
  {
    id: 'project-2',
    title: 'Silicon Valley: Uncovered',
    description: 'A tech thriller exploring the dark side of startup culture.',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2670&auto=format&fit=crop',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'project-3',
    title: 'Echoes of Tomorrow',
    description: 'A sci-fi adventure set in a post-apocalyptic world.',
    coverImage: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?q=80&w=2564&auto=format&fit=crop',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  }
];

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  
  // Load projects from Firestore and combine with sample projects
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      console.log('Loading projects...');
      
      try {
        const firebaseProjects = await getAllProjects();
        console.log('Loaded projects:', firebaseProjects);
        
        // Combine Firebase projects with sample projects
        const combinedProjects = [
          ...firebaseProjects,
          ...SAMPLE_PROJECTS.filter(sample => 
            !firebaseProjects.some(real => real.title === sample.title)
          )
        ];
        setProjects(combinedProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects. Using sample projects instead.',
          variant: 'destructive',
        });
        setProjects(SAMPLE_PROJECTS);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [toast]);
  
  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      console.log('Creating project with data:', data);
      const newProject = await createProject({
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date()
      });
      console.log('Created project:', newProject);
      
      // Update the projects list with both the new project and existing projects
      const updatedProjects = [
        newProject,
        ...projects.filter(p => p.id !== newProject.id)
      ];
      setProjects(updatedProjects);
      
      setCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Project created successfully.',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteProject(id);
      setProjects(projects.filter(project => project.id !== id));
      toast({
        title: 'Success',
        description: 'Project deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const project = projects.find(p => p.id === id);
    if (project) {
      setEditingProject(project);
      setEditDialogOpen(true);
    }
  };
  
  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!editingProject) return;
    
    try {
      await updateProject(editingProject.id, {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastEdited: new Date()
      });
      
      setProjects(projects.map(project => 
        project.id === editingProject.id
          ? {
              ...project,
              title: data.title,
              description: data.description,
              coverImage: data.coverImage,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastEdited: new Date()
            }
          : project
      ));
      
      setEditDialogOpen(false);
      setEditingProject(null);
      toast({
        title: 'Success',
        description: 'Project updated successfully.',
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleExportProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement export functionality
  };

  return (
    <div className="flex flex-col h-screen">
      <ProjectHeader />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <h2 className="text-2xl font-semibold mb-6">Your Projects</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create Project Card */}
              <Card 
                className="h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/40 transition-colors border-dashed border-2"
                onClick={() => setCreateDialogOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <CardTitle className="text-xl text-muted-foreground">Create New Project</CardTitle>
                </CardContent>
              </Card>
              
              {/* Project Cards */}
              {projects.map((project) => {
                const projectSlug = slugify(project.title);
                const lastEdited = project.updatedAt ? new Date(project.updatedAt) : new Date();
                
                return (
                  <Link 
                    href={`/project/${projectSlug}`} 
                    key={project.id}
                    className="block group"
                  >
                    <Card className="h-64 overflow-hidden relative hover:shadow-md transition-shadow">
                      {project.coverImage && (
                        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ 
                          backgroundImage: `url(${project.coverImage})`,
                          opacity: 0.2
                        }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-0" />
                      <div className="relative z-10 h-full flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between p-6">
                          <div className="flex-1 pr-8">
                            <CardTitle className="text-xl">{project.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {project.description}
                            </CardDescription>
                          </div>
                          <div className="absolute top-4 right-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleEditProject(project.id, e)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleExportProject(project.id, e)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                          <p className="text-sm text-muted-foreground">
                            Last edited on {format(lastEdited, 'MMM d, yyyy')}
                          </p>
                        </CardFooter>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Project Dialog */}
      <ProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateProject}
        mode="create"
      />
      
      {/* Edit Project Dialog */}
      {editingProject && (
        <ProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleUpdateProject}
          initialData={{
            title: editingProject.title,
            description: editingProject.description,
            coverImage: editingProject.coverImage,
          }}
          mode="edit"
        />
      )}
    </div>
  );
} 