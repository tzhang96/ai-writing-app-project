"use client";

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  PenLine, 
  Lightbulb, 
  Settings, 
  MessageSquare,
  Download,
  History,
  Search,
  LucideChevronDown,
  Wand2
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { type Mode } from '@/components/writing-app';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  chatSidebarCollapsed: boolean;
  setChatSidebarCollapsed: (collapsed: boolean) => void;
  aiScribeEnabled: boolean;
  setAiScribeEnabled: (enabled: boolean) => void;
  projectId: string;
  projectTitle?: string;
}

export function Header({ 
  mode, 
  setMode, 
  chatSidebarCollapsed, 
  setChatSidebarCollapsed, 
  aiScribeEnabled,
  setAiScribeEnabled,
  projectId,
  projectTitle 
}: HeaderProps) {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <PenLine className="h-6 w-6" />
          <h1 className="text-xl font-bold">Scribe</h1>
        </Link>
        
        {projectTitle && (
          <>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">{projectTitle}</h2>
            </div>
          </>
        )}
        
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
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch 
                id="ai-chat" 
                checked={!chatSidebarCollapsed}
                onCheckedChange={(checked) => setChatSidebarCollapsed(!checked)}
              />
              <Label htmlFor="ai-chat" className="flex items-center gap-1 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                AI Chat
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="ai-scribe" 
                checked={aiScribeEnabled}
                onCheckedChange={setAiScribeEnabled}
              />
              <Label htmlFor="ai-scribe" className="flex items-center gap-1 cursor-pointer">
                <Wand2 className="h-4 w-4" />
                AI Scribe
              </Label>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          
          <Select defaultValue="gemini-2.0-flash">
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
              <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            </SelectContent>
          </Select>
          
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}