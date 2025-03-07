"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChapterWithRelationships } from '@/lib/db/types';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Search
} from 'lucide-react';
import { AiEnhancedTipTapEditor } from '@/components/ui/ai-enhanced-tiptap-editor';

interface ChapterContent {
  id: string;
  content: string;
}

interface TextEditorProps {
  activeChapterId: string | null;
  aiScribeEnabled: boolean;
  activeChapter?: ChapterWithRelationships | null;
  onChapterUpdate?: (chapterId: string, title: string) => void;
}

export function TextEditor({ activeChapterId, aiScribeEnabled, activeChapter, onChapterUpdate }: TextEditorProps) {
  const [chapterContents, setChapterContents] = useState<ChapterContent[]>([
    { 
      id: 'chapter-1', 
      content: 'It was a dark and stormy night. The wind howled through the trees, and the rain pounded against the windows. I sat alone in my study, contemplating the events that had led me to this moment.\n\nThe manuscript lay open on my desk, its pages yellowed with age. I had discovered it in the attic of my grandfather\'s house, hidden away in an old trunk. The story it told was incredible, almost unbelievable, and yet I knew it to be true.'
    },
    { 
      id: 'section-1-1', 
      content: 'The introduction sets the scene for our story. The protagonist discovers an old manuscript that will change their life forever.'
    },
    { 
      id: 'section-1-2', 
      content: 'In this scene, we meet the protagonist for the first time. They are sitting in their study during a storm, reading an old manuscript they found in their grandfather\'s attic.'
    },
    { 
      id: 'chapter-2', 
      content: 'The next morning dawned bright and clear, a stark contrast to the tumultuous night before. I packed the manuscript carefully in my bag and set out for the university. Professor Jenkins would know what to make of it.\n\nThe campus was quiet, most students still asleep in their dorms. I made my way to the history department, my footsteps echoing in the empty hallways.'
    },
    { 
      id: 'section-2-1', 
      content: 'The protagonist decides to seek help from Professor Jenkins, an expert in ancient manuscripts. This introduces the first conflict as the professor reveals something unexpected about the manuscript.'
    },
    { 
      id: 'chapter-3', 
      content: 'Three days later, I found myself on a plane to Istanbul. The manuscript had revealed coordinates to a location in the old city, and Professor Jenkins had insisted I go immediately.\n\n"Time is of the essence," he had said, his eyes gleaming with excitement. "If what this manuscript says is true, we could be on the verge of the greatest historical discovery of the century."'
    }
  ]);
  
  const [currentContent, setCurrentContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  // Use refs instead of state to track update state without triggering re-renders
  const isUpdatingRef = useRef(false);
  const lastActiveChapterIdRef = useRef<string | null>(null);
  
  // Add editor ref to control formatting with proper typing
  const editorRef = useRef<{
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderline: () => void;
    setTextAlign: (align: 'left' | 'center' | 'right') => void;
    toggleBulletList: () => void;
    toggleOrderedList: () => void;
    toggleHeading: (level: 1 | 2 | 3) => void;
    undo: () => void;
    redo: () => void;
    isActive: (name: string, attributes?: Record<string, any>) => boolean;
    focus: () => void;
  } | null>(null);
  
  // Load chapter content ONLY when activeChapterId changes
  useEffect(() => {
    // Skip if no active chapter
    if (!activeChapterId) {
      setCurrentContent('');
      setWordCount(0);
      lastActiveChapterIdRef.current = null;
      return;
    }
    
    // Skip if we're already on this chapter (prevents content reload loops)
    if (activeChapterId === lastActiveChapterIdRef.current && isUpdatingRef.current) {
      return;
    }
    
    // Load content from the chapter
    const chapterContent = chapterContents.find(c => c.id === activeChapterId)?.content || '';
    
    // Update state
    setCurrentContent(chapterContent);
    setWordCount(countWords(extractPlainText(chapterContent)));
    
    // Update our tracking refs
    lastActiveChapterIdRef.current = activeChapterId;
    isUpdatingRef.current = false;
    
  }, [activeChapterId, chapterContents]);
  
  // Extract plain text from HTML content
  const extractPlainText = (html: string) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  const countWords = (text: string) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Content change handler - doesn't trigger the chapter load effect
  const handleContentChange = (newContent: string) => {
    // Set updating flag to prevent content reload
    isUpdatingRef.current = true;
    
    // Update current content and word count
    setCurrentContent(newContent);
    setWordCount(countWords(extractPlainText(newContent)));
    
    // Update chapter content in our local state
    if (activeChapterId) {
      setChapterContents(prevContents => {
        return prevContents.map(c => 
          c.id === activeChapterId 
            ? { ...c, content: newContent } 
            : c
        );
      });
    }
  };
  
  const getChapterTitle = () => {
    if (!activeChapter) return 'No chapter selected';
    return activeChapter.title || 'Untitled Chapter';
  };
  
  const handleTitleClick = () => {
    if (!activeChapter || !onChapterUpdate) return;
    setEditedTitle(activeChapter.title || '');
    setIsEditingTitle(true);
  };
  
  const handleTitleSave = () => {
    if (!activeChapter || !onChapterUpdate || !editedTitle.trim()) return;
    onChapterUpdate(activeChapter.id, editedTitle.trim());
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col relative">
      <div className="border-b p-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => editorRef.current?.toggleBold()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleItalic()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleUnderline()}
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleBulletList()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleOrderedList()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleHeading(1)}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleHeading(2)}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.toggleHeading(3)}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => editorRef.current?.redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 border-b">
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="text-xl font-semibold w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
            autoFocus
          />
        ) : (
          <h2 
            className="text-xl font-semibold cursor-pointer hover:text-primary/80 transition-colors"
            onClick={handleTitleClick}
          >
            {getChapterTitle()}
          </h2>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-6">
        {activeChapterId ? (
          <AiEnhancedTipTapEditor
            value={currentContent}
            onChange={handleContentChange}
            className="w-full h-full"
            placeholder="Start writing here..."
            aiScribeEnabled={aiScribeEnabled}
            onAiContent={(newContent) => {
              // Mark as updating to prevent content reload
              isUpdatingRef.current = true;
              handleContentChange(newContent);
            }}
            editorRef={editorRef}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a chapter or section to start writing
          </div>
        )}
      </ScrollArea>
      
      <div className="border-t p-2 flex justify-between items-center text-sm text-muted-foreground">
        <div>
          {wordCount} words
        </div>
        <div>
          Last saved: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}