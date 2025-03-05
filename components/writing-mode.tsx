"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChapterSidebar } from '@/components/writing/chapter-sidebar';
import { TextEditor } from '@/components/writing/text-editor';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// import { OutliningPanel } from '@/components/planning/outlining-panel';

interface WritingModeProps {
  chatSidebarCollapsed: boolean;
  projectId: string;
  aiScribeEnabled: boolean;
}

export function WritingMode({ chatSidebarCollapsed, projectId, aiScribeEnabled }: WritingModeProps) {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>('chapter-1');
  const [isChapterDetailView, setIsChapterDetailView] = useState(false);
  
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
                activeChapterId={activeChapterId} 
                setActiveChapterId={setActiveChapterId} 
                onViewModeChange={(mode) => setIsChapterDetailView(mode === 'detail')}
              />
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />
        
        {/* Main Editor Area */}
        <ResizablePanel defaultSize={75}>
          <TextEditor 
            activeChapterId={activeChapterId} 
            aiScribeEnabled={aiScribeEnabled} 
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