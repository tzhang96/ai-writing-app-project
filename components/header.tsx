"use client";

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PenLine, Lightbulb, Save, Download, Upload, Settings, MessageSquare } from 'lucide-react';
import { type Mode } from '@/components/writing-app';
import Link from 'next/link';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  chatSidebarCollapsed: boolean;
  setChatSidebarCollapsed: (collapsed: boolean) => void;
  projectId: string;
}

export function Header({ mode, setMode, chatSidebarCollapsed, setChatSidebarCollapsed, projectId }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <PenLine className="h-6 w-6" />
          <h1 className="text-xl font-bold">Scribe</h1>
        </Link>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button 
              variant={mode === 'planning' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setMode('planning')}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Planning
            </Button>
            <Button 
              variant={mode === 'writing' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setMode('writing')}
              className="gap-2"
            >
              <PenLine className="h-4 w-4" />
              Writing
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={chatSidebarCollapsed ? 'ghost' : 'default'}
            size="sm"
            onClick={() => setChatSidebarCollapsed(!chatSidebarCollapsed)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            AI Helper
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <Save className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Upload className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}