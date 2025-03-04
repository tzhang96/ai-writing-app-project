"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, MoveVertical, ArrowUpDown } from 'lucide-react';

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  sequence: number;
}

function PlotPointCard({ 
  plotPoint, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast
}: { 
  plotPoint: PlotPoint;
  onUpdate: (id: string, field: keyof PlotPoint, value: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Card className="mb-4 relative">
      <div className="absolute right-2 top-2 flex gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onMoveUp(plotPoint.id)}
          disabled={isFirst}
        >
          <ArrowUpDown className="h-4 w-4 rotate-180" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onMoveDown(plotPoint.id)}
          disabled={isLast}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(plotPoint.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <Input
          value={plotPoint.title}
          onChange={(e) => onUpdate(plotPoint.id, 'title', e.target.value)}
          className="font-semibold text-lg"
          placeholder="Plot point title..."
        />
      </CardHeader>
      <CardContent>
        <Textarea
          value={plotPoint.description}
          onChange={(e) => onUpdate(plotPoint.id, 'description', e.target.value)}
          className="min-h-[100px]"
          placeholder="Describe what happens in this plot point..."
        />
      </CardContent>
    </Card>
  );
}

export function PlotTab() {
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MoveVertical className="h-5 w-5" />
          Plot Structure
        </h2>
        <Button onClick={addPlotPoint} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Plot Point
        </Button>
      </div>
      
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Story Arc</CardTitle>
          <CardDescription>
            Organize your story's plot points in sequential order. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)]">
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
              />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}