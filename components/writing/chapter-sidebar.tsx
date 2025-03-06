"use client";

import { useState, useEffect } from 'react';
import { ChapterList } from './chapter-list';
import { ChapterDetail } from './chapter-detail';
import { ArrowLeft, BookText } from 'lucide-react';
import { Button } from '../ui/button';
import { ChapterWithRelationships } from '@/lib/db/types';
import { getChapterWithRelationships, createChapter, getProjectChapters } from '@/lib/db/chapters';

export interface ChapterSidebarProps {
  projectId: string;
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  onViewModeChange?: (mode: 'list' | 'detail') => void;
  aiScribeEnabled?: boolean;
  textEditor?: React.ReactNode;
}

export function ChapterSidebar({ 
  projectId,
  activeChapterId, 
  setActiveChapterId,
  onViewModeChange,
  aiScribeEnabled = true,
  textEditor
}: ChapterSidebarProps) {
  // State for view mode (list or detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Animation state - helps with cleanup after animation
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Chapters state
  const [chapters, setChapters] = useState<ChapterWithRelationships[]>([]);

  // Check if this is a sample project
  const isSampleProject = projectId.startsWith('project-');
  
  // Load chapters on mount and after operations
  const loadChapters = async () => {
    console.log('Loading chapters for project:', projectId);
    setIsLoading(true);
    try {
      if (isSampleProject) {
        // Use mock data for sample projects
        const mockChapters: ChapterWithRelationships[] = [
          {
            id: 'chapter-1',
            projectId,
            title: 'Chapter 1: The Beginning',
            order: 0,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            connections: {
              characters: [],
              settings: [],
              plotPoints: [],
            }
          },
          {
            id: 'chapter-2',
            projectId,
            title: 'Chapter 2: The Journey',
            order: 1,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            connections: {
              characters: [],
              settings: [],
              plotPoints: [],
            }
          },
          {
            id: 'chapter-3',
            projectId,
            title: 'Chapter 3: The Revelation',
            order: 2,
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            connections: {
              characters: [],
              settings: [],
              plotPoints: [],
            }
          }
        ];
        setChapters(mockChapters);
      } else {
        // Load real data from Firestore
        const projectChapters = await getProjectChapters(projectId);
        console.log('Fetched project chapters:', projectChapters);
        
        const chaptersWithRelationships = await Promise.all(
          projectChapters.map(async chapter => {
            console.log('Fetching relationships for chapter:', chapter.id);
            return getChapterWithRelationships(chapter.id);
          })
        );
        console.log('Chapters with relationships:', chaptersWithRelationships);
        
        setChapters(chaptersWithRelationships);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('ChapterSidebar mounted with projectId:', projectId);
    loadChapters();
  }, [projectId]);
  
  // Notify parent component when view mode changes
  useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, onViewModeChange]);
  
  // Handle chapter selection (show detail view)
  const handleChapterSelect = (id: string) => {
    setActiveChapterId(id);
    setIsAnimating(true);
    setViewMode('detail');
  };
  
  // Handle go back to list
  const handleGoBackToList = () => {
    setIsAnimating(true);
    setViewMode('list');
  };
  
  // Find the active chapter
  const getActiveChapter = (): ChapterWithRelationships | undefined => {
    return chapters.find(chapter => chapter.id === activeChapterId);
  };
  
  // Update chapters state
  const handleChaptersChange = async (updatedChapters: ChapterWithRelationships[]) => {
    setChapters(updatedChapters);
  };
  
  // Handle chapter operations
  const handleChapterCreate = async () => {
    if (isSampleProject) {
      // For sample projects, just add a new mock chapter
      const newChapter: ChapterWithRelationships = {
        id: `chapter-${chapters.length + 1}`,
        projectId,
        title: `Chapter ${chapters.length + 1}`,
        order: chapters.length,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        connections: {
          characters: [],
          settings: [],
          plotPoints: [],
        }
      };
      setChapters([...chapters, newChapter]);
    } else {
      // For real projects, use Firestore
      await loadChapters();
    }
  };
  
  const handleChapterDelete = async () => {
    if (isSampleProject) {
      // For sample projects, just filter out the chapter
      if (activeChapterId) {
        setChapters(chapters.filter(chapter => chapter.id !== activeChapterId));
        setActiveChapterId(null);
        setViewMode('list');
      }
    } else {
      // For real projects, use Firestore
      if (activeChapterId) {
        setActiveChapterId(null);
        setViewMode('list');
      }
      await loadChapters();
    }
  };
  
  // Update a specific chapter
  const updateChapter = async (updatedChapter: ChapterWithRelationships) => {
    console.log('Updating chapter:', updatedChapter);
    if (isSampleProject) {
      const updatedChapters = chapters.map(chapter => 
        chapter.id === updatedChapter.id ? updatedChapter : chapter
      );
      setChapters(updatedChapters);
    } else {
      // For real projects, update in Firestore and refresh
      await loadChapters();
    }
  };

  // Handle chapter title update
  const handleChapterTitleUpdate = async (chapterId: string, newTitle: string) => {
    const chapterToUpdate = chapters.find(c => c.id === chapterId);
    if (!chapterToUpdate) return;

    const updatedChapter = {
      ...chapterToUpdate,
      title: newTitle,
      updatedAt: new Date()
    };

    await updateChapter(updatedChapter);
  };

  // Get the active chapter title
  const getActiveChapterTitle = (): string => {
    const activeChapter = getActiveChapter();
    return activeChapter?.title || "Chapter Details";
  };
  
  // Handle transition end to clean up animation state
  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Consistent Header */}
      <div className="border-b p-4 flex items-center">
        {viewMode === 'detail' ? (
          <div className="flex items-center w-full">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGoBackToList}
              className="mr-2 flex-shrink-0"
              aria-label="Back to all chapters"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative overflow-hidden max-w-[calc(100%-40px)]">
              <h2 className="text-lg font-semibold whitespace-nowrap overflow-hidden">
                {getActiveChapterTitle()}
              </h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center pl-2">
            <BookText className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-semibold">All Chapters</h2>
          </div>
        )}
      </div>
      
      {/* Content Area with Animation */}
      <div className="flex-1 relative">
        {/* List View */}
        <div 
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
            viewMode === 'detail' ? '-translate-x-full' : 'translate-x-0'
          }`}
          onTransitionEnd={handleAnimationEnd}
        >
          <ChapterList
            chapters={chapters}
            projectId={projectId}
            activeChapterId={activeChapterId}
            onChapterSelect={handleChapterSelect}
            onChaptersChange={handleChaptersChange}
            onChapterCreate={handleChapterCreate}
            onChapterDelete={handleChapterDelete}
            isLoading={isLoading}
          />
        </div>
        
        {/* Detail View */}
        <div 
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
            viewMode === 'detail' ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {activeChapterId && getActiveChapter() ? (
            <ChapterDetail
              chapter={getActiveChapter()!}
              projectId={projectId}
              onGoBack={handleGoBackToList}
              onChapterUpdate={updateChapter}
              aiScribeEnabled={aiScribeEnabled}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}