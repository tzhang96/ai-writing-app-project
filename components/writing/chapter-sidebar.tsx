"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  File, 
  Trash2, 
  Edit, 
  Check, 
  X 
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
  expanded: boolean;
}

interface Section {
  id: string;
  title: string;
}

export function ChapterSidebar({ 
  activeChapterId, 
  setActiveChapterId 
}: { 
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Beginning',
      sections: [
        { id: 'section-1-1', title: 'Introduction' },
        { id: 'section-1-2', title: 'First Scene' }
      ],
      expanded: true
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: The Middle',
      sections: [
        { id: 'section-2-1', title: 'Conflict Arises' }
      ],
      expanded: false
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: The End',
      sections: [],
      expanded: false
    }
  ]);
  
  const [editingItem, setEditingItem] = useState<{ id: string, type: 'chapter' | 'section' } | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const toggleChapterExpand = (chapterId: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, expanded: !chapter.expanded } 
        : chapter
    ));
  };
  
  const addChapter = () => {
    const newId = `chapter-${Date.now()}`;
    setChapters([
      ...chapters,
      {
        id: newId,
        title: `Chapter ${chapters.length + 1}`,
        sections: [],
        expanded: false
      }
    ]);
  };
  
  const addSection = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    const newId = `section-${chapterId}-${Date.now()}`;
    setChapters(chapters.map(c => 
      c.id === chapterId 
        ? { 
            ...c, 
            sections: [...c.sections, { id: newId, title: `New Section` }],
            expanded: true
          } 
        : c
    ));
  };
  
  const startEditing = (id: string, type: 'chapter' | 'section', currentTitle: string) => {
    setEditingItem({ id, type });
    setEditingTitle(currentTitle);
  };
  
  const saveEditing = () => {
    if (!editingItem) return;
    
    if (editingItem.type === 'chapter') {
      setChapters(chapters.map(chapter => 
        chapter.id === editingItem.id 
          ? { ...chapter, title: editingTitle } 
          : chapter
      ));
    } else {
      setChapters(chapters.map(chapter => ({
        ...chapter,
        sections: chapter.sections.map(section => 
          section.id === editingItem.id 
            ? { ...section, title: editingTitle } 
            : section
        )
      })));
    }
    
    setEditingItem(null);
  };
  
  const cancelEditing = () => {
    setEditingItem(null);
  };
  
  const deleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(chapter => chapter.id !== chapterId));
    if (activeChapterId === chapterId) {
      setActiveChapterId(null);
    }
  };
  
  const deleteSection = (sectionId: string) => {
    setChapters(chapters.map(chapter => ({
      ...chapter,
      sections: chapter.sections.filter(section => section.id !== sectionId)
    })));
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Chapters</h2>
        <Button variant="ghost" size="icon" onClick={addChapter}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-1">
        {chapters.map(chapter => (
          <div key={chapter.id} className="space-y-1">
            <ContextMenu>
              <ContextMenuTrigger>
                <div 
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md ${
                    activeChapterId === chapter.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  }`}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0"
                    onClick={() => toggleChapterExpand(chapter.id)}
                  >
                    {chapter.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setActiveChapterId(chapter.id)}
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
                      <span className="text-sm font-medium">{chapter.title}</span>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => addSection(chapter.id)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => startEditing(chapter.id, 'chapter', chapter.title)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => addSection(chapter.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
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
            
            {chapter.expanded && chapter.sections.length > 0 && (
              <div className="ml-6 space-y-1">
                {chapter.sections.map(section => (
                  <ContextMenu key={section.id}>
                    <ContextMenuTrigger>
                      <div 
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                          activeChapterId === section.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setActiveChapterId(section.id)}
                      >
                        <File className="h-4 w-4 text-muted-foreground" />
                        
                        {editingItem?.id === section.id && editingItem.type === 'section' ? (
                          <div className="flex items-center gap-1 flex-1">
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
                          <span className="text-sm">{section.title}</span>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => startEditing(section.id, 'section', section.title)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem 
                        onClick={() => deleteSection(section.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}