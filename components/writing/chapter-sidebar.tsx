"use client";

import { useState, useEffect } from 'react';
import { ChapterList } from './chapter-list';
import { ChapterDetail } from './chapter-detail';
import { Chapter, ChapterMetadata } from './chapter-types';
import { ChevronLeft, BookText } from 'lucide-react';
import { Button } from '../ui/button';

export interface ChapterSidebarProps {
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  onViewModeChange?: (mode: 'list' | 'detail') => void;
}

export function ChapterSidebar({ 
  activeChapterId, 
  setActiveChapterId,
  onViewModeChange
}: ChapterSidebarProps) {
  // State for view mode (list or detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Notify parent component when view mode changes
  useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, onViewModeChange]);
  
  // Sample initial metadata
  const defaultMetadata: ChapterMetadata = {
    storyBeats: '',
    characters: [],
    settings: [],
    plotPoints: [],
    notes: ''
  };
  
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Beginning',
      metadata: {
        storyBeats: 'Protagonist discovers an ancient manuscript in the university library. The manuscript contains strange symbols that appear to be a code.',
        characters: ['Professor Alex Jenkins', 'Main Character', 'Librarian'],
        settings: ['University Library', 'Research Office'],
        plotPoints: ['Discovery of the manuscript', 'First decoding attempt'],
        notes: 'Focus on building mystery and curiosity about the manuscript origins'
      },
      order: 0
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: The Middle',
      metadata: {
        storyBeats: 'The protagonist starts to decode the manuscript and realizes it points to a hidden location.',
        characters: ['Professor Alex Jenkins', 'Main Character', 'Mysterious Caller'],
        settings: ['Research Lab', 'Coffee Shop'],
        plotPoints: ['Phone call warning', 'Decision to investigate further'],
        notes: 'Increase tension with the mysterious caller, imply potential danger ahead'
      },
      order: 1
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: The End',
      metadata: {
        storyBeats: 'Travel to Istanbul to follow the coordinates found in the manuscript. Discovery of an ancient hidden chamber beneath the city.',
        characters: ['Main Character', 'Local Guide', 'Rival Archaeologist'],
        settings: ['Istanbul Old City', 'Underground Chamber'],
        plotPoints: ['Arrival in Istanbul', 'Finding the hidden entrance', 'Confrontation with rival'],
        notes: 'Climactic discovery scene with vivid descriptions of the chamber and artifacts'
      },
      order: 2
    }
  ]);
  
  // Handle chapter selection (show detail view)
  const handleChapterSelect = (id: string) => {
    setActiveChapterId(id);
    setViewMode('detail');
  };
  
  // Handle go back to list
  const handleGoBackToList = () => {
    setViewMode('list');
  };
  
  // Find the active chapter
  const getActiveChapter = (): Chapter | undefined => {
    return chapters.find(chapter => chapter.id === activeChapterId);
  };
  
  // Update a specific chapter
  const updateChapter = (updatedChapter: Chapter) => {
    setChapters(chapters.map(chapter => 
      chapter.id === updatedChapter.id 
        ? updatedChapter 
        : chapter
    ));
  };

  // Add a new chapter
  const addChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: `New Chapter`,
      metadata: { ...defaultMetadata },
      order: chapters.length
    };
    
    setChapters([...chapters, newChapter]);
  };
  
  // Get the active chapter title
  const getActiveChapterTitle = (): string => {
    const activeChapter = getActiveChapter();
    return activeChapter ? activeChapter.title : "Chapter Details";
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Consistent Header */}
      <div className="border-b p-4 flex items-center">
        <div className="flex items-center gap-2">
          {viewMode === 'detail' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBackToList}
              className="mr-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-semibold flex items-center">
            <BookText className="h-5 w-5 mr-2" />
            {viewMode === 'list' ? 'Chapters' : getActiveChapterTitle()}
          </h2>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <ChapterList
            chapters={chapters}
            activeChapterId={activeChapterId}
            onChapterSelect={handleChapterSelect}
            onChaptersChange={setChapters}
          />
        ) : (
          activeChapterId && getActiveChapter() ? (
            <ChapterDetail
              chapter={getActiveChapter()!}
              onGoBack={handleGoBackToList}
              onChapterUpdate={updateChapter}
            />
          ) : (
            <div className="p-4 text-center">
              No chapter selected. 
              <button 
                className="text-primary hover:underline ml-2" 
                onClick={handleGoBackToList}
              >
                Go back to list
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}