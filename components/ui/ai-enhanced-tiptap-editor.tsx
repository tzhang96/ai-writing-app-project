"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { 
  AiScribePopup, 
  AiWritePopup, 
  useAiScribe, 
  useAiWrite 
} from "@/components/ai-scribe-popup";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface AiEnhancedTipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  aiScribeEnabled: boolean;
  onAiContent?: (newContent: string) => void;
  editorRef?: React.MutableRefObject<{
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
  } | null>;
}

export function AiEnhancedTipTapEditor({
  value,
  onChange,
  className,
  placeholder = "Start writing...",
  aiScribeEnabled,
  onAiContent,
  editorRef,
}: AiEnhancedTipTapEditorProps) {
  // Reference to the editor container for positioning popups
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // State to track if we're in a browser environment (for SSR compatibility)
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Set isBrowser to true on component mount
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Image,
      Link,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Update parent component with HTML content
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleDOMEvents: {
        mousedown: (view, event) => {
          return false;
        },
        mouseup: (view, event) => {
          return false;
        },
      },
    },
  });
  
  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Store current selection state
      const { from, to } = editor.state.selection;
      
      // Update content but don't force selection change
      editor.commands.setContent(value, false);
      
      // Try to restore selection if it was meaningful
      if (from !== to) {
        setTimeout(() => {
          // Only set selection if it's still valid for the new content
          try {
            editor.commands.setTextSelection({ from, to });
          } catch (e) {
            // If the selection is no longer valid, we can't restore it
            console.log('Could not restore selection after content update');
          }
        }, 0);
      }
    }
  }, [editor, value]);
  
  // Create a textarea ref simulation for AI features
  const simulatedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // This effect creates and updates a simulated textarea element for compatibility
  // with the existing AI popup logic which expects a textarea
  useEffect(() => {
    if (!editor || !editorContainerRef.current) return;
    
    // Create a simulated textarea that will never be rendered
    if (!simulatedTextareaRef.current) {
      simulatedTextareaRef.current = document.createElement('textarea');
    }
    
    // Update the simulated textarea with editor content
    const textarea = simulatedTextareaRef.current;
    textarea.value = editor.getText();
    
    // Override textarea methods for position calculations
    textarea.getBoundingClientRect = () => {
      return editorContainerRef.current?.getBoundingClientRect() || new DOMRect();
    };
    
    // Custom methods to map TipTap positions to textarea positions
    textarea.selectionStart = editor.state.selection.from;
    textarea.selectionEnd = editor.state.selection.to;
    
    // Custom focus method
    textarea.focus = () => {
      editor.commands.focus();
    };
    
    return () => {
      // Clean up if needed
    };
  }, [editor]);
  
  // Initialize AI Scribe functionality
  const {
    showAiPopup,
    selectedText,
    popupPosition,
    handleAiAction,
    closePopup,
    selectionInfo
  } = useAiScribe(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
  // Initialize AI Write functionality
  const {
    showWritePopup,
    cursorPosition,
    handleWrite,
    closeWritePopup
  } = useAiWrite(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
  // Handle AI generated content
  const handleAiGeneratedContent = (newContent: string) => {
    if (onAiContent) {
      onAiContent(newContent);
    } else if (editor) {
      // Insert content at cursor position
      editor.commands.insertContent(newContent);
      
      // Focus editor after content insertion
      setTimeout(() => {
        editor.commands.focus();
      }, 0);
    }
  };
  
  // Handle text selection for AI Scribe
  useEffect(() => {
    if (!editor || !aiScribeEnabled) return;
    
    const handleSelectionChange = () => {
      if (editor.view.state.selection.empty) return;
      
      // Map TipTap selection to simulated textarea
      if (simulatedTextareaRef.current) {
        const start = editor.state.selection.from;
        const end = editor.state.selection.to;
        
        simulatedTextareaRef.current.selectionStart = start;
        simulatedTextareaRef.current.selectionEnd = end;
      }
    };
    
    // Listen for selection changes
    editor.on('selectionUpdate', handleSelectionChange);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor, aiScribeEnabled]);
  
  // Expose editor methods to parent component
  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = {
        toggleBold: () => {
          editor.chain().focus().toggleBold().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        toggleItalic: () => {
          editor.chain().focus().toggleItalic().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        toggleUnderline: () => {
          editor.chain().focus().toggleUnderline().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        setTextAlign: (align) => {
          if (align === 'left') {
            editor.chain().focus().setTextAlign('left').run();
            setTimeout(() => editor.commands.focus(), 0);
          }
          if (align === 'center') {
            editor.chain().focus().setTextAlign('center').run();
            setTimeout(() => editor.commands.focus(), 0);
          }
          if (align === 'right') {
            editor.chain().focus().setTextAlign('right').run();
            setTimeout(() => editor.commands.focus(), 0);
          }
        },
        toggleBulletList: () => {
          editor.chain().focus().toggleBulletList().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        toggleOrderedList: () => {
          editor.chain().focus().toggleOrderedList().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        toggleHeading: (level) => {
          editor.chain().focus().toggleHeading({ level }).run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        undo: () => {
          editor.chain().focus().undo().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        redo: () => {
          editor.chain().focus().redo().run();
          setTimeout(() => editor.commands.focus(), 0);
        },
        isActive: (name, attributes) => editor.isActive(name, attributes),
      };
    }
    
    return () => {
      if (editorRef) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);
  
  // Render popups in a portal
  const renderPopups = () => {
    if (!isBrowser) return null;
    
    return createPortal(
      <TooltipProvider>
        {/* AI Scribe Popup */}
        {showAiPopup && (
          <AiScribePopup
            selectedText={selectedText}
            position={popupPosition}
            onAction={(action, instructions) => {
              handleAiAction(action, instructions);
              const demoContent = `[AI ${action} with instructions: ${instructions || 'none'}]`;
              handleAiGeneratedContent(demoContent);
            }}
            onClose={closePopup}
            selectionInfo={selectionInfo}
          />
        )}
        
        {/* AI Write Popup */}
        {showWritePopup && (
          <AiWritePopup
            position={cursorPosition}
            onWrite={(instructions) => {
              handleWrite(instructions);
              const demoContent = instructions 
                ? `[AI writing with instructions: ${instructions}]` 
                : "[AI generated writing]";
              handleAiGeneratedContent(demoContent);
            }}
            onClose={closeWritePopup}
          />
        )}
      </TooltipProvider>,
      document.body
    );
  };
  
  if (!editor) {
    return null;
  }
  
  return (
    <div 
      ref={editorContainerRef} 
      className={cn("tiptap-editor-container", className)}
    >
      <EditorContent editor={editor} />
      {renderPopups()}
    </div>
  );
}

AiEnhancedTipTapEditor.displayName = "AiEnhancedTipTapEditor"; 