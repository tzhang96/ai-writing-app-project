"use client";

import { useState, useEffect } from 'react';
import { ChapterList } from './chapter-list';
import { ChapterDetail } from './chapter-detail';
import { Chapter, ChapterMetadata } from './chapter-types';
import { ArrowLeft, BookText } from 'lucide-react';
import { Button } from '../ui/button';

export interface ChapterSidebarProps {
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  onViewModeChange?: (mode: 'list' | 'detail') => void;
  aiScribeEnabled?: boolean;
}

export function ChapterSidebar({ 
  activeChapterId, 
  setActiveChapterId,
  onViewModeChange,
  aiScribeEnabled = true
}: ChapterSidebarProps) {
  // State for view mode (list or detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Animation state - helps with cleanup after animation
  const [isAnimating, setIsAnimating] = useState(false);
  
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
  
  // Sample chapters data
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: '1',
      title: 'Chapter 1: The Beginning',
      order: 1,
      metadata: {
        storyBeats: 'Introduction to the main character and their ordinary world.',
        characters: [
          {
            name: 'Main Character',
            aliases: ['MC', 'Hero'],
            attributes: {
              personality: ['Determined', 'Curious'],
              appearance: ['Tall', 'Dark hair'],
              background: ['Orphaned at young age']
            },
            relationships: []
          }
        ],
        settings: [
          {
            name: 'Small Town',
            description: 'A quiet town where nothing exciting happens',
            attributes: {
              type: 'Rural Setting',
              features: ['Main Street', 'Town Square'],
              significance: ['Character\'s hometown'],
              associatedCharacters: ['Main Character']
            },
            characterConnections: []
          }
        ],
        plotPoints: [
          {
            id: 'plot-1',
            title: 'Main character introduced',
            description: "We meet the protagonist in their ordinary world, establishing their normal life before the adventure begins.",
            sequence: 0
          }
        ],
        notes: 'This chapter sets up the main conflict of the story.'
      }
    },
    {
      id: '2',
      title: 'Chapter 2: The Journey Begins',
      order: 2,
      metadata: {
        storyBeats: 'The protagonist leaves their comfort zone and embarks on a journey.',
        characters: [
          {
            name: 'Mentor',
            aliases: ['Guide', 'Wise One'],
            attributes: {
              personality: ['Wise', 'Patient'],
              appearance: ['Elderly', 'White beard'],
              background: ['Former adventurer']
            },
            relationships: [
              {
                targetName: 'Main Character',
                type: 'Mentor',
                description: 'Guides the main character on their journey'
              }
            ]
          }
        ],
        settings: [
          {
            name: 'The Road',
            description: 'The long road leading away from town',
            attributes: {
              type: 'Journey Setting',
              features: ['Winding path', 'Forest edge'],
              significance: ['First step of adventure'],
              associatedCharacters: ['Main Character', 'Mentor']
            },
            characterConnections: []
          }
        ],
        plotPoints: [
          {
            id: 'plot-4',
            title: 'Protagonist leaves home',
            description: "The main character decides to leave their familiar surroundings and venture into the unknown.",
            sequence: 0
          },
          {
            id: 'plot-5',
            title: 'Meeting the mentor',
            description: "The protagonist encounters someone who provides guidance, wisdom, or tools for the journey ahead.",
            sequence: 1
          },
          {
            id: 'plot-6',
            title: 'First challenge faced',
            description: "The protagonist faces their first significant obstacle or test in the new world.",
            sequence: 2
          }
        ],
        notes: 'Focus on the emotional state of the protagonist as they leave familiar surroundings.'
      }
    },
    {
      id: '3',
      title: 'Chapter 3: New Allies',
      order: 3,
      metadata: {
        storyBeats: 'The protagonist meets new allies who will help them on their journey.',
        characters: [
          {
            name: 'Sidekick',
            aliases: ['Friend', 'Companion'],
            attributes: {
              personality: ['Loyal', 'Humorous'],
              appearance: ['Short', 'Agile'],
              background: ['Escaped from captivity']
            },
            relationships: [
              {
                targetName: 'Main Character',
                type: 'Friend',
                description: 'Loyal companion who provides comic relief'
              }
            ]
          }
        ],
        settings: [
          {
            name: 'Tavern',
            description: 'A bustling tavern where travelers meet',
            attributes: {
              type: 'Social Setting',
              features: ['Crowded bar', 'Private booths'],
              significance: ['Meeting place for allies'],
              associatedCharacters: ['Main Character', 'Sidekick']
            },
            characterConnections: []
          },
          {
            name: 'Ancient Prophecy',
            description: 'A prophecy that foretells the coming of a hero',
            attributes: {
              type: 'Lore Element',
              features: ['Written in ancient language', 'Partially destroyed'],
              significance: ['Motivates the quest', 'Creates mystery'],
              associatedCharacters: ['Main Character', 'Mentor']
            },
            characterConnections: []
          }
        ],
        plotPoints: [
          {
            id: 'plot-7',
            title: 'New allies introduced',
            description: "The protagonist meets important characters who will help them throughout the story.",
            sequence: 0
          },
          {
            id: 'plot-8',
            title: 'Team dynamics established',
            description: "The relationships and roles within the group are defined, setting up future interactions.",
            sequence: 1
          },
          {
            id: 'plot-9',
            title: 'Secondary conflict emerges',
            description: "A new problem or antagonistic force is revealed, complicating the protagonist's journey.",
            sequence: 2
          }
        ],
        notes: 'Develop the relationships between the protagonist and their new allies.'
      }
    }
  ]);
  
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
  const getActiveChapter = (): Chapter | undefined => {
    return chapters.find(chapter => chapter.id === activeChapterId);
  };
  
  // Update a specific chapter
  const updateChapter = (updatedChapter: Chapter) => {
    const updatedChapters = chapters.map(chapter => 
      chapter.id === updatedChapter.id ? updatedChapter : chapter
    );
    setChapters(updatedChapters);
  };

  // Add a new chapter
  const addChapter = () => {
    const newChapter: Chapter = {
      id: `${Date.now()}`,
      title: `New Chapter ${chapters.length + 1}`,
      order: chapters.length,
      metadata: {
        storyBeats: '',
        characters: [],
        settings: [],
        plotPoints: [],
        notes: ''
      }
    };
    
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    setActiveChapterId(newChapter.id);
    setViewMode('detail');
  };
  
  // Get the active chapter title
  const getActiveChapterTitle = (): string => {
    const activeChapter = getActiveChapter();
    return activeChapter ? activeChapter.title : "Chapter Details";
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
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"></div>
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
            activeChapterId={activeChapterId}
            onChapterSelect={handleChapterSelect}
            onChaptersChange={setChapters}
          />
                </div>
        
        {/* Detail View */}
        <div 
          className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
            viewMode === 'list' ? 'translate-x-full' : 'translate-x-0'
          }`}
          onTransitionEnd={handleAnimationEnd}
        >
          {(viewMode === 'detail' || isAnimating) && activeChapterId && getActiveChapter() ? (
            <ChapterDetail
              chapter={getActiveChapter()!}
              onGoBack={handleGoBackToList}
              onChapterUpdate={updateChapter}
              aiScribeEnabled={aiScribeEnabled}
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
            )}
          </div>
      </div>
    </div>
  );
}