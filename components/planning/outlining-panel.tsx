"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Scene {
  id: string;
  title: string;
  description: string;
}

interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
  isCollapsed?: boolean;
}

interface Act {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  isCollapsed?: boolean;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        {children}
      </div>
    </div>
  );
}

function DragHandle({ attributes, listeners }: { attributes: any; listeners: any }) {
  return (
    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface EditingState {
  type: 'act' | 'chapter' | 'scene';
  id: string;
  field: 'title' | 'description';
}

export function OutliningPanel() {
  const [acts, setActs] = useState<Act[]>([
    {
      id: 'act-1',
      title: 'Act 1: Setup',
      description: 'Introduce the protagonist and their normal world before the inciting incident.',
      isCollapsed: false,
      chapters: [
        {
          id: 'chapter-1',
          title: 'Chapter 1: The Normal World',
          isCollapsed: false,
          scenes: [
            {
              id: 'scene-1-1',
              title: 'Opening Scene',
              description: 'Protagonist in their everyday life, showing their current state and main character traits.'
            },
            {
              id: 'scene-1-2',
              title: 'Foreshadowing',
              description: 'Subtle hints at the coming adventure and changes.'
            }
          ]
        },
        {
          id: 'chapter-2',
          title: 'Chapter 2: The Call to Adventure',
          isCollapsed: false,
          scenes: [
            {
              id: 'scene-2-1',
              title: 'Inciting Incident',
              description: 'The event that disrupts the normal world and sets the story in motion.'
            }
          ]
        }
      ]
    },
    {
      id: 'act-2',
      title: 'Act 2: Confrontation',
      description: 'The protagonist faces escalating challenges and obstacles.',
      isCollapsed: false,
      chapters: [
        {
          id: 'chapter-3',
          title: 'Chapter 3: Into the Unknown',
          isCollapsed: false,
          scenes: [
            {
              id: 'scene-3-1',
              title: 'New World',
              description: 'Protagonist enters an unfamiliar situation or environment.'
            }
          ]
        }
      ]
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleAct = (actId: string) => {
    setActs(acts.map(act => 
      act.id === actId ? { ...act, isCollapsed: !act.isCollapsed } : act
    ));
  };

  const toggleChapter = (actId: string, chapterId: string) => {
    setActs(acts.map(act => 
      act.id === actId 
        ? {
            ...act,
            chapters: act.chapters.map(chapter =>
              chapter.id === chapterId 
                ? { ...chapter, isCollapsed: !chapter.isCollapsed }
                : chapter
            )
          }
        : act
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Handle reordering based on the ID prefix (act-, chapter-, scene-)
    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('act-')) {
      setActs(acts => {
        const oldIndex = acts.findIndex(act => act.id === activeId);
        const newIndex = acts.findIndex(act => act.id === overId);
        return arrayMove(acts, oldIndex, newIndex);
      });
    } else if (activeId.startsWith('chapter-')) {
      // Find the parent act and reorder its chapters
      setActs(acts => {
        return acts.map(act => {
          const chapters = [...act.chapters];
          const oldIndex = chapters.findIndex(chapter => chapter.id === activeId);
          if (oldIndex === -1) return act;
          const newIndex = chapters.findIndex(chapter => chapter.id === overId);
          return {
            ...act,
            chapters: arrayMove(chapters, oldIndex, newIndex),
          };
        });
      });
    } else if (activeId.startsWith('scene-')) {
      // Find the parent act and chapter and reorder its scenes
      setActs(acts => {
        return acts.map(act => ({
          ...act,
          chapters: act.chapters.map(chapter => {
            const scenes = [...chapter.scenes];
            const oldIndex = scenes.findIndex(scene => scene.id === activeId);
            if (oldIndex === -1) return chapter;
            const newIndex = scenes.findIndex(scene => scene.id === overId);
            return {
              ...chapter,
              scenes: arrayMove(scenes, oldIndex, newIndex),
            };
          }),
        }));
      });
    }
  };

  const startEditing = (type: 'act' | 'chapter' | 'scene', id: string, field: 'title' | 'description', initialValue: string) => {
    setEditing({ type, id, field });
    setEditValue(initialValue);
  };

  const handleEditSave = () => {
    if (!editing) return;

    setActs(acts.map(act => {
      if (editing.type === 'act' && act.id === editing.id) {
        return {
          ...act,
          [editing.field]: editValue
        };
      }
      
      if (editing.type === 'chapter') {
        return {
          ...act,
          chapters: act.chapters.map(chapter => 
            chapter.id === editing.id
              ? { ...chapter, [editing.field]: editValue }
              : chapter
          )
        };
      }
      
      if (editing.type === 'scene') {
        return {
          ...act,
          chapters: act.chapters.map(chapter => ({
            ...chapter,
            scenes: chapter.scenes.map(scene =>
              scene.id === editing.id
                ? { ...scene, [editing.field]: editValue }
                : scene
            )
          }))
        };
      }
      
      return act;
    }));

    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') {
      setEditing(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center pr-3">
        <h2 className="text-2xl font-bold">Story Outline</h2>
        <Button variant="outline" size="sm">
          Generate...
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={acts.map(act => act.id)} strategy={verticalListSortingStrategy}>
              {acts.map((act) => (
                <Card key={act.id} className="border shadow-sm">
                  <Collapsible open={!act.isCollapsed}>
                    <CardHeader className="p-4 bg-muted/50">
                      <SortableItem id={act.id}>
                        <div className="flex-1">
                          {editing?.type === 'act' && editing.id === act.id && editing.field === 'title' ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={handleKeyDown}
                              className="font-semibold"
                              autoFocus
                            />
                          ) : (
                            <CardTitle 
                              onClick={() => startEditing('act', act.id, 'title', act.title)}
                              className="cursor-text hover:bg-muted/50 rounded px-2 -mx-2"
                            >
                              {act.title}
                            </CardTitle>
                          )}
                          {editing?.type === 'act' && editing.id === act.id && editing.field === 'description' ? (
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleEditSave}
                              onKeyDown={handleKeyDown}
                              className="mt-1 text-sm text-muted-foreground"
                              autoFocus
                            />
                          ) : (
                            <p 
                              onClick={() => startEditing('act', act.id, 'description', act.description)}
                              className="text-sm text-muted-foreground mt-1 cursor-text hover:bg-muted/50 rounded px-2 -mx-2"
                            >
                              {act.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <CollapsibleTrigger
                            onClick={() => toggleAct(act.id)}
                            className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors"
                          >
                            {act.isCollapsed ? (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </CollapsibleTrigger>
                        </div>
                      </SortableItem>
                    </CardHeader>

                    <CollapsibleContent>
                      <div className="border-t">
                        <SortableContext items={act.chapters.map(chapter => chapter.id)} strategy={verticalListSortingStrategy}>
                          {act.chapters.map((chapter) => (
                            <Card key={chapter.id} className="rounded-none border-x-0 border-t-0 last:border-b-0">
                              <Collapsible open={!chapter.isCollapsed}>
                                <CardHeader className="p-3 bg-muted/30">
                                  <SortableItem id={chapter.id}>
                                    <div className="flex-1">
                                      {editing?.type === 'chapter' && editing.id === chapter.id && editing.field === 'title' ? (
                                        <Input
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={handleEditSave}
                                          onKeyDown={handleKeyDown}
                                          className="text-base"
                                          autoFocus
                                        />
                                      ) : (
                                        <CardTitle 
                                          className="text-base cursor-text hover:bg-muted/50 rounded px-2 -mx-2"
                                          onClick={() => startEditing('chapter', chapter.id, 'title', chapter.title)}
                                        >
                                          {chapter.title}
                                        </CardTitle>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                      <CollapsibleTrigger
                                        onClick={() => toggleChapter(act.id, chapter.id)}
                                        className="h-8 w-8 flex items-center justify-center hover:text-primary transition-colors"
                                      >
                                        {chapter.isCollapsed ? (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </CollapsibleTrigger>
                                    </div>
                                  </SortableItem>
                                </CardHeader>

                                <CollapsibleContent>
                                  <div className="border-t">
                                    <SortableContext items={chapter.scenes.map(scene => scene.id)} strategy={verticalListSortingStrategy}>
                                      {chapter.scenes.map((scene) => (
                                        <Card key={scene.id} className="rounded-none border-x-0 border-t-0 last:border-b-0">
                                          <CardHeader className="p-3 bg-muted/10">
                                            <SortableItem id={scene.id}>
                                              <div className="flex-1">
                                                {editing?.type === 'scene' && editing.id === scene.id && editing.field === 'title' ? (
                                                  <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleEditSave}
                                                    onKeyDown={handleKeyDown}
                                                    className="text-sm font-medium"
                                                    autoFocus
                                                  />
                                                ) : (
                                                  <CardTitle 
                                                    className="text-sm font-medium cursor-text hover:bg-muted/50 rounded px-2 -mx-2"
                                                    onClick={() => startEditing('scene', scene.id, 'title', scene.title)}
                                                  >
                                                    {scene.title}
                                                  </CardTitle>
                                                )}
                                                {editing?.type === 'scene' && editing.id === scene.id && editing.field === 'description' ? (
                                                  <Textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={handleEditSave}
                                                    onKeyDown={handleKeyDown}
                                                    className="mt-1 text-sm text-muted-foreground"
                                                    autoFocus
                                                  />
                                                ) : (
                                                  <p 
                                                    className="text-sm text-muted-foreground mt-1 cursor-text hover:bg-muted/50 rounded px-2 -mx-2"
                                                    onClick={() => startEditing('scene', scene.id, 'description', scene.description)}
                                                  >
                                                    {scene.description}
                                                  </p>
                                                )}
                                              </div>
                                            </SortableItem>
                                          </CardHeader>
                                        </Card>
                                      ))}
                                    </SortableContext>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </Card>
                          ))}
                        </SortableContext>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </SortableContext>
          </DndContext>
          <Button 
            variant="outline" 
            size="icon"
            className="w-full h-8"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
} 