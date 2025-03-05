"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ChevronDown, ChevronRight, ChevronUp, ChevronDown as ChevronDownIcon, MoreVertical, Wand2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  sequence: number;
}

interface PlotPointCardProps { 
  plotPoint: PlotPoint;
  onUpdate: (id: string, field: keyof PlotPoint, value: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  aiScribeEnabled: boolean;
}

function PlotPointCard({ 
  plotPoint, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast,
  aiScribeEnabled
}: PlotPointCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleAiContent = (newContent: string) => {
    if (newContent) {
      onUpdate(plotPoint.id, 'description', plotPoint.description + newContent);
    }
  };

  return (
    <Card className="mb-3 overflow-hidden relative">
      <div 
        className="flex items-center h-9 px-2 cursor-pointer hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
        )}
        
        <div className="flex items-center gap-2 mr-2">
          <div className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {plotPoint.sequence}
          </div>
        </div>
        
        <Input
          value={plotPoint.title}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate(plotPoint.id, 'title', e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-7 px-0 font-medium border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          placeholder="Plot point title..."
        />
        
        <div className="ml-auto flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(plotPoint.id);
            }}
            disabled={isFirst}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(plotPoint.id);
            }}
            disabled={isLast}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => onDelete(plotPoint.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className={cn("transition-all", isExpanded ? "max-h-[500px]" : "max-h-0 overflow-hidden")}>
        <CardContent className="pt-2 px-3 pb-3">
          <AiEnhancedTextarea
            value={plotPoint.description}
            onChange={(e) => onUpdate(plotPoint.id, 'description', e.target.value)}
            className="min-h-[80px] resize-none border focus-visible:ring-1 text-sm"
            placeholder="Describe what happens in this plot point..."
            aiScribeEnabled={aiScribeEnabled}
            onAiContent={handleAiContent}
          />
        </CardContent>
      </div>
    </Card>
  );
}

interface PlotTabProps {
  aiScribeEnabled: boolean;
}

export function PlotTab({ aiScribeEnabled }: PlotTabProps) {
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([
    { id: '1', title: 'Introduction', description: 'The beginning of your story...', sequence: 1 },
    { id: '2', title: 'Rising Action', description: 'Conflict begins to develop...', sequence: 2 },
    { id: '3', title: 'Climax', description: 'The turning point of your story...', sequence: 3 },
    { id: '4', title: 'Falling Action', description: 'Events after the climax...', sequence: 4 },
    { id: '5', title: 'Resolution', description: 'The conclusion of your story...', sequence: 5 },
  ]);
  
  const addPlotPoint = () => {
    const newId = Date.now().toString();
    const newSequence = plotPoints.length > 0 
      ? Math.max(...plotPoints.map(p => p.sequence)) + 1 
      : 1;
    
    setPlotPoints([
      ...plotPoints, 
      { 
        id: newId, 
        title: 'New Plot Point', 
        description: '', 
        sequence: newSequence 
      }
    ]);
  };
  
  const updatePlotPoint = (id: string, field: keyof PlotPoint, value: string) => {
    setPlotPoints(plotPoints.map(point => 
      point.id === id 
        ? { ...point, [field]: value } 
        : point
    ));
  };
  
  const deletePlotPoint = (id: string) => {
    setPlotPoints(plotPoints.filter(p => p.id !== id));
  };
  
  const movePlotPointUp = (id: string) => {
    const index = plotPoints.findIndex(p => p.id === id);
    if (index <= 0) return;
    
    const newPlotPoints = [...plotPoints];
    const temp = newPlotPoints[index].sequence;
    newPlotPoints[index].sequence = newPlotPoints[index - 1].sequence;
    newPlotPoints[index - 1].sequence = temp;
    
    setPlotPoints([...newPlotPoints].sort((a, b) => a.sequence - b.sequence));
  };
  
  const movePlotPointDown = (id: string) => {
    const index = plotPoints.findIndex(p => p.id === id);
    if (index >= plotPoints.length - 1) return;
    
    const newPlotPoints = [...plotPoints];
    const temp = newPlotPoints[index].sequence;
    newPlotPoints[index].sequence = newPlotPoints[index + 1].sequence;
    newPlotPoints[index + 1].sequence = temp;
    
    setPlotPoints([...newPlotPoints].sort((a, b) => a.sequence - b.sequence));
  };
  
  // Sort plot points by sequence
  const sortedPlotPoints = [...plotPoints].sort((a, b) => a.sequence - b.sequence);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <Button onClick={addPlotPoint} className="ml-auto gap-2">
          <Plus className="h-4 w-4" />
          Add Plot Point
        </Button>
      </div>
      
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-190px)]">
            <div className="p-5 pb-8">
              {sortedPlotPoints.map((plotPoint, index) => (
                <PlotPointCard
                  key={plotPoint.id}
                  plotPoint={plotPoint}
                  onUpdate={updatePlotPoint}
                  onDelete={deletePlotPoint}
                  onMoveUp={movePlotPointUp}
                  onMoveDown={movePlotPointDown}
                  isFirst={index === 0}
                  isLast={index === sortedPlotPoints.length - 1}
                  aiScribeEnabled={aiScribeEnabled}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}