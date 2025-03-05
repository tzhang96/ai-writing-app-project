"use client";

import { useState, useEffect, useRef } from 'react';
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
import { AiEnhancedTextarea } from '@/components/ui/ai-enhanced-textarea';

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
  
  useEffect(() => {
    if (activeChapterId) {
      const content = chapterContents.find(c => c.id === activeChapterId)?.content || '';
      setCurrentContent(content);
      setWordCount(countWords(content));
    } else {
      setCurrentContent('');
      setWordCount(0);
    }
  }, [activeChapterId, chapterContents]);
  
  const countWords = (text: string) => {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCurrentContent(newContent);
    setWordCount(countWords(newContent));
    
    if (activeChapterId) {
      setChapterContents(chapterContents.map(c => 
        c.id === activeChapterId 
          ? { ...c, content: newContent } 
          : c
      ));
    }
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
          <Button variant="ghost" size="icon">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="icon">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
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
          <AiEnhancedTextarea
            value={currentContent}
            onChange={handleContentChange}
            className="w-full h-full min-h-[calc(100vh-250px)] p-4 text-lg leading-relaxed resize-none focus:outline-none bg-transparent"
            placeholder="Start writing here..."
            aiScribeEnabled={aiScribeEnabled}
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