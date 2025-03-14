"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainstormingTab } from '@/components/planning/brainstorming-tab';
import { CharactersTab } from '@/components/planning/characters-tab';
import { WorldTab } from '@/components/planning/world-tab';
import { PlotTab } from '@/components/planning/plot-tab';
import { StyleTab } from '@/components/planning/style-tab';
// import { OutliningPanel } from '@/components/planning/outlining-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface PlanningModeProps {
  chatSidebarCollapsed: boolean;
  projectId: string;
  aiScribeEnabled: boolean;
}

export function PlanningMode({ chatSidebarCollapsed, projectId, aiScribeEnabled }: PlanningModeProps) {
  const [activeTab, setActiveTab] = useState('brainstorming');
  
  // Make sure activeTab is set to 'world' if it was previously 'setting'
  useEffect(() => {
    if (activeTab === 'setting') {
      setActiveTab('world');
    }
  }, [activeTab]);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Main Content Area */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Planning Tabs */}
            <ResizablePanel defaultSize={100} minSize={30} maxSize={100}>
              <div className="h-full p-4 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="brainstorming">Brainstorming</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="world">World</TabsTrigger>
                    <TabsTrigger value="plot">Plot</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-hidden mt-4">
                    <TabsContent value="brainstorming" className="h-full">
                      <BrainstormingTab aiScribeEnabled={aiScribeEnabled} />
                    </TabsContent>
                    <TabsContent value="characters" className="h-full">
                      <CharactersTab aiScribeEnabled={aiScribeEnabled} />
                    </TabsContent>
                    <TabsContent value="world" className="h-full">
                      <WorldTab aiScribeEnabled={aiScribeEnabled} />
                    </TabsContent>
                    <TabsContent value="plot" className="h-full">
                      <PlotTab aiScribeEnabled={aiScribeEnabled} />
                    </TabsContent>
                    <TabsContent value="style" className="h-full">
                      <StyleTab aiScribeEnabled={aiScribeEnabled} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            {/* Removed the Outlining Panel */}
          </ResizablePanelGroup>
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