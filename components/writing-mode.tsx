"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChapterSidebar } from '@/components/writing/chapter-sidebar';
import { TextEditor } from '@/components/writing/text-editor';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ChapterWithRelationships } from '@/lib/db/types';
import { getChapterWithRelationships, getProjectChapters } from '@/lib/db/chapters';
// import { OutliningPanel } from '@/components/planning/outlining-panel';

interface WritingModeProps {
  chatSidebarCollapsed: boolean;
  projectId: string;
  aiScribeEnabled: boolean;
}

export function WritingMode({ chatSidebarCollapsed, projectId, aiScribeEnabled }: WritingModeProps) {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isChapterDetailView, setIsChapterDetailView] = useState(false);
  const [activeChapter, setActiveChapter] = useState<ChapterWithRelationships | null>(null);
  const [chapters, setChapters] = useState<ChapterWithRelationships[]>([]);
  
  // Load chapters and set initial active chapter
  useEffect(() => {
    const loadInitialChapters = async () => {
      try {
        if (projectId.startsWith('project-')) {
          // For sample projects, use mock data
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
            // ... other mock chapters
          ];
          setChapters(mockChapters);
          if (!activeChapterId && mockChapters.length > 0) {
            setActiveChapterId(mockChapters[0].id);
          }
        } else {
          // For real projects, load from Firestore
          const projectChapters = await getProjectChapters(projectId);
          if (projectChapters.length > 0) {
            setChapters(projectChapters);
            if (!activeChapterId) {
              setActiveChapterId(projectChapters[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial chapters:', error);
      }
    };
    
    loadInitialChapters();
  }, [projectId]);
  
  // Load active chapter when it changes
  useEffect(() => {
    const loadActiveChapter = async () => {
      if (!activeChapterId) {
        setActiveChapter(null);
        return;
      }
      
      try {
        if (projectId.startsWith('project-')) {
          // For sample projects, find chapter in local state
          const sampleChapter = chapters.find(c => c.id === activeChapterId);
          setActiveChapter(sampleChapter || null);
        } else {
          // For real projects, load from Firestore
          const chapter = await getChapterWithRelationships(activeChapterId);
          setActiveChapter(chapter);
        }
      } catch (error) {
        console.error('Error loading active chapter:', error);
        setActiveChapter(null);
      }
    };
    
    loadActiveChapter();
  }, [activeChapterId, projectId, chapters]);
  
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Sidebar (Chapters) */}
        <ResizablePanel 
          defaultSize={isChapterDetailView ? 35 : 25} 
          minSize={20}
          maxSize={isChapterDetailView ? 45 : 35}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setLeftSidebarCollapsed(true)}
          onExpand={() => setLeftSidebarCollapsed(false)}
        >
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <ChapterSidebar 
                projectId={projectId}
                activeChapterId={activeChapterId} 
                setActiveChapterId={setActiveChapterId} 
                onViewModeChange={(mode) => setIsChapterDetailView(mode === 'detail')}
                aiScribeEnabled={aiScribeEnabled}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />
        
        {/* Main Editor Area */}
        <ResizablePanel defaultSize={75}>
          <TextEditor 
            activeChapterId={activeChapterId} 
            activeChapter={activeChapter}
            aiScribeEnabled={aiScribeEnabled}
            onChapterUpdate={async (chapterId, title) => {
              if (!activeChapter) return;
              const updatedChapter = {
                ...activeChapter,
                title,
                updatedAt: new Date()
              };
              setActiveChapter(updatedChapter);
            }}
          />
        </ResizablePanel>

        {/* Right Sidebar (Chat) */}
        {!chatSidebarCollapsed && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={20}
              minSize={15}
              maxSize={30}
            >
              <ChatSidebar isCollapsed={false} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}