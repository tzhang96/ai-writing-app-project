"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
}

export function TextEditor({ activeChapterId, aiScribeEnabled }: TextEditorProps) {
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
  
  // Reference to control editor methods
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
  } | null>(null);
  
  // State to track current formatting
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false,
    heading1: false,
    heading2: false,
    heading3: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
  });
  
  useEffect(() => {
    if (activeChapterId) {
      const content = chapterContents.find(c => c.id === activeChapterId)?.content || '';
      setCurrentContent(content);
      setWordCount(countWords(
        // Strip HTML tags for word count
        content.replace(/<[^>]*>/g, '')
      ));
    } else {
      setCurrentContent('');
      setWordCount(0);
    }
  }, [activeChapterId, chapterContents]);
  
  // Update format state when editor selection changes
  useEffect(() => {
    // Set up an interval to check formatting state
    const intervalId = setInterval(() => {
      if (editorRef.current) {
        setFormatState({
          bold: editorRef.current.isActive('bold'),
          italic: editorRef.current.isActive('italic'),
          underline: editorRef.current.isActive('underline'),
          bulletList: editorRef.current.isActive('bulletList'),
          orderedList: editorRef.current.isActive('orderedList'),
          heading1: editorRef.current.isActive('heading', { level: 1 }),
          heading2: editorRef.current.isActive('heading', { level: 2 }),
          heading3: editorRef.current.isActive('heading', { level: 3 }),
          alignLeft: editorRef.current.isActive('textAlign', { textAlign: 'left' }) || 
                   (!editorRef.current.isActive('textAlign', { textAlign: 'center' }) && 
                   !editorRef.current.isActive('textAlign', { textAlign: 'right' })),
          alignCenter: editorRef.current.isActive('textAlign', { textAlign: 'center' }),
          alignRight: editorRef.current.isActive('textAlign', { textAlign: 'right' }),
        });
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const countWords = (text: string) => {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const getChapterTitle = () => {
    if (!activeChapterId) return 'No chapter selected';
    
    const chapterId = activeChapterId;
    if (chapterId.startsWith('chapter-')) {
      return `Chapter ${chapterId.split('-')[1]}`;
    } else if (chapterId.startsWith('section-')) {
      const parts = chapterId.split('-');
      return `Section ${parts[2]} (Chapter ${parts[1]})`;
    }
    
    return 'Unknown';
  };
  
  return (
    <div className="h-full flex flex-col relative">
      <div className="border-b p-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant={formatState.bold ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleBold()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.italic ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleItalic()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.underline ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleUnderline()}
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={formatState.alignLeft ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.alignCenter ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.alignRight ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.setTextAlign('right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={formatState.bulletList ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleBulletList()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.orderedList ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleOrderedList()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={formatState.heading1 ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleHeading(1)}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.heading2 ? "default" : "ghost"}
            size="icon"
            onClick={() => editorRef.current?.toggleHeading(2)}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button 
            variant={formatState.heading3 ? "default" : "ghost"}
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
        <h2 className="text-xl font-semibold">{getChapterTitle()}</h2>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        {activeChapterId ? (
          <AiEnhancedTipTapEditor
            value={currentContent}
            onChange={(newContent) => {
              setCurrentContent(newContent);
              setWordCount(countWords(
                // Strip HTML tags for word count
                newContent.replace(/<[^>]*>/g, '')
              ));
              
              if (activeChapterId) {
                setChapterContents(chapterContents.map(c => 
                  c.id === activeChapterId 
                    ? { ...c, content: newContent } 
                    : c
                ));
              }
            }}
            className="w-full"
            placeholder="Start writing here..."
            aiScribeEnabled={aiScribeEnabled}
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