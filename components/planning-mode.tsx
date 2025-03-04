"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainstormingTab } from '@/components/planning/brainstorming-tab';
import { CharactersTab } from '@/components/planning/characters-tab';
import { SettingTab } from '@/components/planning/setting-tab';
import { PlotTab } from '@/components/planning/plot-tab';
import { StyleTab } from '@/components/planning/style-tab';
import { OutliningPanel } from '@/components/planning/outlining-panel';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface PlanningModeProps {
  chatSidebarCollapsed: boolean;
  projectId: string;
}

export function PlanningMode({ chatSidebarCollapsed, projectId }: PlanningModeProps) {
  const [activeTab, setActiveTab] = useState('brainstorming');
  
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Main Content Area */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Planning Tabs */}
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="brainstorming">Brainstorming</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="setting">Setting</TabsTrigger>
                    <TabsTrigger value="plot">Plot</TabsTrigger>
                    <TabsTrigger value="style">Style</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-auto mt-4">
                    <TabsContent value="brainstorming" className="h-full">
                      <BrainstormingTab />
                    </TabsContent>
                    <TabsContent value="characters" className="h-full">
                      <CharactersTab />
                    </TabsContent>
                    <TabsContent value="setting" className="h-full">
                      <SettingTab />
                    </TabsContent>
                    <TabsContent value="plot" className="h-full">
                      <PlotTab />
                    </TabsContent>
                    <TabsContent value="style" className="h-full">
                      <StyleTab />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Outlining */}
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
              <div className="h-full p-4">
                <OutliningPanel />
              </div>
            </ResizablePanel>
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