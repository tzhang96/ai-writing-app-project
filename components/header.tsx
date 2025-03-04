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
  LucideChevronDown
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
          
          <Select defaultValue="gemini-2.0-flash">
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            </SelectContent>
          </Select>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="relative w-60">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground opacity-70" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pl-8 h-9 border-foreground/20 focus-visible:ring-foreground/20 focus-visible:border-foreground/30 placeholder:text-foreground/50"
            />
          </div>

          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <Download className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}