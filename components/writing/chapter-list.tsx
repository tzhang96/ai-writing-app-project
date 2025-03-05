"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X,
  GripVertical
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import { ChapterMetadata, Chapter } from './chapter-types';

interface SortableChapterItemProps {
  chapter: Chapter;
  activeChapterId: string | null;
  editingItem: { id: string, type: 'chapter' } | null;
  editingTitle: string;
  handleItemClick: (id: string) => void;
  startEditing: (id: string, currentTitle: string) => void;
  saveEditing: () => void;
  cancelEditing: () => void;
  deleteChapter: (id: string) => void;
  setEditingTitle: (title: string) => void;
}

// Sortable Chapter Item Component
function SortableChapterItem({
  chapter,
  activeChapterId,
  editingItem,
  editingTitle,
  handleItemClick,
  startEditing,
  saveEditing,
  cancelEditing,
  deleteChapter,
  setEditingTitle
}: SortableChapterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md group ${
              activeChapterId === chapter.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
          >
            <div 
              className="cursor-grab flex items-center justify-center p-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => handleItemClick(chapter.id)}
            >
              {editingItem?.id === chapter.id && editingItem.type === 'chapter' ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="h-7 py-1"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEditing}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditing}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative overflow-hidden">
                  <span className="text-sm font-medium whitespace-nowrap block overflow-hidden">
                    {chapter.title}
                  </span>
                  <div 
                    className={`absolute inset-y-0 right-0 w-8 pointer-events-none ${
                      activeChapterId === chapter.id 
                        ? 'bg-gradient-to-l from-accent to-transparent' 
                        : 'bg-gradient-to-l from-background to-transparent group-hover:from-accent/50'
                    }`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => startEditing(chapter.id, chapter.title)}>
            <Edit className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => deleteChapter(chapter.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export interface ChapterListProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onChapterSelect: (id: string) => void;
  onChaptersChange: (chapters: Chapter[]) => void;
}

export function ChapterList({ 
  chapters, 
  activeChapterId, 
  onChapterSelect, 
  onChaptersChange 
}: ChapterListProps) {
  const [editingItem, setEditingItem] = useState<{ id: string, type: 'chapter' } | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance in pixels
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the indices of the chapters being reordered
      const oldIndex = chapters.findIndex((item) => item.id === active.id);
      const newIndex = chapters.findIndex((item) => item.id === over.id);
      
      // Create a new array with the chapters reordered
      const newChapters = arrayMove(chapters, oldIndex, newIndex);
      
      // Update the order property for all chapters
      const updatedChapters = newChapters.map((chapter, index) => ({
        ...chapter,
        order: index
      }));
      
      onChaptersChange(updatedChapters);
    }
  };
  
  const startEditing = (id: string, currentTitle: string) => {
    setEditingItem({ id, type: 'chapter' });
    setEditingTitle(currentTitle);
  };
  
  const saveEditing = () => {
    if (!editingItem) return;
    
    const updatedChapters = chapters.map(chapter => 
      chapter.id === editingItem.id 
        ? { ...chapter, title: editingTitle } 
        : chapter
    );
    
    onChaptersChange(updatedChapters);
    setEditingItem(null);
  };
  
  const cancelEditing = () => {
    setEditingItem(null);
  };
  
  const deleteChapter = (chapterId: string) => {
    // Get the chapters without the deleted one
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId);
    
    // Reorder the remaining chapters
    const reorderedChapters = updatedChapters.map((chapter, index) => ({
      ...chapter,
      order: index
    }));
    
    onChaptersChange(reorderedChapters);
  };
  
  const addChapter = () => {
    const newId = `chapter-${Date.now()}`;
    const newOrder = chapters.length;
    
    const defaultMetadata: ChapterMetadata = {
      storyBeats: '',
      characters: [],
      settings: [],
      plotPoints: [],
      notes: ''
    };
    
    const newChapter: Chapter = {
      id: newId,
      title: `Chapter ${chapters.length + 1}`,
      metadata: defaultMetadata,
      order: newOrder
    };
    
    onChaptersChange([...chapters, newChapter]);
  };
  
  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="space-y-1 flex-1">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sortedChapters.map(chapter => chapter.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedChapters.map(chapter => (
              <SortableChapterItem
                key={chapter.id}
                chapter={chapter}
                activeChapterId={activeChapterId}
                editingItem={editingItem}
                editingTitle={editingTitle}
                handleItemClick={onChapterSelect}
                startEditing={startEditing}
                saveEditing={saveEditing}
                cancelEditing={cancelEditing}
                deleteChapter={deleteChapter}
                setEditingTitle={setEditingTitle}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      <Button 
        onClick={addChapter} 
        className="w-full mt-4 flex items-center justify-center"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Chapter
      </Button>
    </div>
  );
} 