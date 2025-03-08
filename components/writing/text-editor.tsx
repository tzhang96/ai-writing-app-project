"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChapterWithRelationships } from '@/lib/db/types';
import { updateChapterContent } from '@/lib/db/chapters';
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
  const [currentContent, setCurrentContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  // Use refs to track state without triggering re-renders
  const isUpdatingRef = useRef(false);
  const lastActiveChapterIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentChapterIdRef = useRef<string | null>(null);
  
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
  
  const isSampleProject = activeChapter?.projectId.startsWith('project-') ?? false;

  // Extract plain text from HTML content
  const extractPlainText = (html: string) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  // Count words in text
  const countWords = (text: string) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  // Function to clear auto-save timer
  const clearAutoSaveTimer = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  // Function to save content for a specific chapter
  const saveChapterContent = async (chapterId: string, content: string) => {
    if (!isSampleProject && chapterId && content !== lastSavedContent) {
      try {
        await updateChapterContent(chapterId, content);
        setLastSavedContent(content);
        setLastSavedTime(new Date());
      } catch (error) {
        console.error('Error saving chapter content:', error);
      }
    }
  };

  // Save content before unmounting or switching chapters
  useEffect(() => {
    return () => {
      // Save any pending changes before unmounting
      if (currentChapterIdRef.current && currentContent !== lastSavedContent) {
        saveChapterContent(currentChapterIdRef.current, currentContent);
      }
      clearAutoSaveTimer();
    };
  }, []);
  
  // Handle chapter switching
  useEffect(() => {
    const handleChapterSwitch = async () => {
      // Save content of previous chapter if needed
      if (lastActiveChapterIdRef.current && currentContent !== lastSavedContent) {
        await saveChapterContent(lastActiveChapterIdRef.current, currentContent);
      }

      // Clear the auto-save timer
      clearAutoSaveTimer();

      // Skip if no active chapter
      if (!activeChapterId || !activeChapter) {
        setCurrentContent('');
        setWordCount(0);
        lastActiveChapterIdRef.current = null;
        currentChapterIdRef.current = null;
        return;
      }
      
      // Skip if we're already on this chapter (prevents content reload loops)
      if (activeChapterId === lastActiveChapterIdRef.current && isUpdatingRef.current) {
        return;
      }
      
      // Load content from the active chapter
      const chapterContent = activeChapter.content || '';
      
      // Update state
      setCurrentContent(chapterContent);
      setLastSavedContent(chapterContent);
      setWordCount(countWords(extractPlainText(chapterContent)));
      
      // Update our tracking refs
      lastActiveChapterIdRef.current = activeChapterId;
      currentChapterIdRef.current = activeChapterId;
      isUpdatingRef.current = false;
    };

    handleChapterSwitch();
  }, [activeChapterId, activeChapter]);
  
  // Content change handler with auto-save
  const handleContentChange = (newContent: string) => {
    const currentChapterId = currentChapterIdRef.current;
    
    // Don't process changes if we don't have an active chapter
    if (!currentChapterId) return;

    // Set updating flag to prevent content reload
    isUpdatingRef.current = true;
    
    // Update current content and word count
    setCurrentContent(newContent);
    setWordCount(countWords(extractPlainText(newContent)));

    // Only proceed with auto-save if this is not a sample project
    if (!isSampleProject) {
      // Clear any existing auto-save timer
      clearAutoSaveTimer();

      // Set new auto-save timer
      autoSaveTimerRef.current = setTimeout(() => {
        // Verify we're still on the same chapter before saving
        if (currentChapterId === currentChapterIdRef.current) {
          saveChapterContent(currentChapterId, newContent);
        }
      }, 2500); // 2.5 seconds delay
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
            chapterId={activeChapterId}
            projectId={activeChapter?.projectId}
            contentType="text"
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
          {lastSavedTime ? `Last saved: ${lastSavedTime.toLocaleTimeString()}` : 'Not saved yet'}
        </div>
      </div>
    </div>
  );
}