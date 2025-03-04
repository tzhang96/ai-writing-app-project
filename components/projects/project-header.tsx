"use client";

import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PenLine, Settings } from 'lucide-react';

export function ProjectHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2 font-semibold">
          <PenLine className="h-6 w-6" />
          <h1 className="text-xl font-bold">Scribe</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
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