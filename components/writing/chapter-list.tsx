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
  GripVertical,
  Loader2
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
import { ChapterWithRelationships } from '@/lib/db/types';
import { updateChapterOrder, updateChapterTitle, deleteChapter, createChapter } from '@/lib/db/chapters';

interface ChapterListProps {
  chapters: ChapterWithRelationships[];
  activeChapterId: string | null;
  onChapterSelect: (id: string) => void;
  onChaptersChange: (chapters: ChapterWithRelationships[]) => void;
  isLoading?: boolean;
  projectId: string;
  onChapterCreate?: () => void;
  onChapterDelete?: () => void;
}

interface SortableChapterItemProps {
  chapter: ChapterWithRelationships;
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

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering chapter selection
    startEditing(chapter.id, chapter.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md group ${
              activeChapterId === chapter.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
            onClick={() => handleItemClick(chapter.id)}
          >
            <div 
              className="cursor-grab flex items-center justify-center p-1"
              {...attributes}
              {...listeners}
              onClick={e => e.stopPropagation()} // Prevent chapter selection when grabbing
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {editingItem?.id === chapter.id && editingItem.type === 'chapter' ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
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
                  <span 
                    className="text-sm font-medium whitespace-nowrap block overflow-hidden cursor-pointer hover:text-primary/80 transition-colors"
                    onDoubleClick={handleTitleDoubleClick}
                  >
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

export function ChapterList({ 
  chapters, 
  activeChapterId, 
  onChapterSelect, 
  onChaptersChange,
  isLoading = false,
  projectId,
  onChapterCreate,
  onChapterDelete
}: ChapterListProps) {
  const [editingItem, setEditingItem] = useState<{ id: string, type: 'chapter' } | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if this is a sample project
  const isSampleProject = projectId.startsWith('project-');
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const startEditing = (id: string, currentTitle: string) => {
    setEditingItem({ id, type: 'chapter' });
    setEditingTitle(currentTitle);
  };
  
  const saveEditing = async () => {
    if (!editingItem || !editingTitle.trim()) return;
    
    setIsSaving(true);
    try {
      if (!isSampleProject) {
        await updateChapterTitle(editingItem.id, editingTitle.trim());
      }
      
      const updatedChapters = chapters.map(chapter => 
        chapter.id === editingItem.id 
          ? { ...chapter, title: editingTitle.trim() }
          : chapter
      );
      
      onChaptersChange(updatedChapters);
    } catch (error) {
      console.error('Error updating chapter title:', error);
    } finally {
      setIsSaving(false);
      setEditingItem(null);
      setEditingTitle('');
    }
  };
  
  const cancelEditing = () => {
    setEditingItem(null);
    setEditingTitle('');
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex(chapter => chapter.id === active.id);
      const newIndex = chapters.findIndex(chapter => chapter.id === over.id);
      
      const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
      
      setIsSaving(true);
      try {
        if (!isSampleProject) {
          await Promise.all(
            reorderedChapters.map((chapter, index) => 
              updateChapterOrder(chapter.id, index)
            )
          );
        }
        
        const updatedChapters = reorderedChapters.map(
          (chapter, index) => ({ ...chapter, order: index })
        );
        
        onChaptersChange(updatedChapters);
      } catch (error) {
        console.error('Error updating chapter order:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }
    
    setIsSaving(true);
    try {
      if (!isSampleProject) {
        await deleteChapter(chapterId);
      }
      
      const updatedChapters = chapters.filter(chapter => chapter.id !== chapterId);
      
      if (!isSampleProject) {
        await Promise.all(
          updatedChapters.map((chapter, index) => 
            updateChapterOrder(chapter.id, index)
          )
        );
      }
      
      const reorderedChapters = updatedChapters.map((chapter, index) => ({
        ...chapter,
        order: index
      }));
      
      onChaptersChange(reorderedChapters);
      onChapterDelete?.();
    } catch (error) {
      console.error('Error deleting chapter:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddChapter = async () => {
    setIsSaving(true);
    try {
      let newChapter: ChapterWithRelationships;
      
      if (isSampleProject) {
        // For sample projects, create a mock chapter
        newChapter = {
          id: `chapter-${chapters.length + 1}`,
          projectId,
          title: `Chapter ${chapters.length + 1}`,
          order: chapters.length,
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          connections: {
            characters: [],
            settings: [],
            plotPoints: [],
          }
        };
      } else {
        // For real projects, use Firestore
        const createdChapter = await createChapter(
          projectId,
          `Chapter ${chapters.length + 1}`,
          chapters.length
        );
        
        newChapter = {
          ...createdChapter,
          connections: {
            characters: [],
            settings: [],
            plotPoints: [],
          }
        };
      }
      
      // Update local state
      const updatedChapters = [...chapters, newChapter];
      onChaptersChange(updatedChapters);
      
      // Notify parent for any additional handling
      onChapterCreate?.();
      
      // Start editing the new chapter title
      startEditing(newChapter.id, newChapter.title);
    } catch (error) {
      console.error('Error creating chapter:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  
  if (isLoading || isSaving) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
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
                deleteChapter={handleDeleteChapter}
                setEditingTitle={setEditingTitle}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      <Button 
        onClick={handleAddChapter} 
        className="w-full mt-4 flex items-center justify-center"
        variant="outline"
        disabled={isLoading || isSaving}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Chapter
      </Button>
    </div>
  );
} 