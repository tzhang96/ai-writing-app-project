"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor, Editor } from '@tiptap/react';
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
import { generateAIContent } from "@/lib/services/ai";
import PersistentHighlight from "./extensions/PersistentHighlight";
import { highlightSelection, clearAllHighlights } from "./extensions/highlightUtils";
import '@/styles/tiptap.css'; // Import TipTap styling

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
    focus: () => void;
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
  // State to track if we're in a browser environment (for SSR compatibility)
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Flag to track programmatic updates
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track the last set content to avoid update loops
  const [lastSetContent, setLastSetContent] = useState(value);
  
  // Reference to the editor container for positioning popups
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // State for AI generation
  const [isGenerating, setIsGenerating] = useState(false);
  
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
      PersistentHighlight,
    ],
    content: value,
    autofocus: false, // Don't autofocus initially
    onUpdate: () => {
      // Intentionally empty - we use the transaction handler
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none w-full max-w-none p-4',
      },
      handleKeyDown: (view, event) => {
        // Let all key events pass through to the editor
        return false;
      },
    },
    enableInputRules: true,
    enablePasteRules: true,
  });
  
  // Create a simulated textarea for AI features
  const simulatedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Set up simulated textarea for AI features
  useEffect(() => {
    if (!editor || !isBrowser) return;
    
    // Create a simulated textarea that will never be rendered
    if (!simulatedTextareaRef.current) {
      simulatedTextareaRef.current = document.createElement('textarea');
      console.log('Created simulated textarea for AI popups');
    }
    
    // Update with editor state
    const textarea = simulatedTextareaRef.current;
    
    // Override methods for compatibility with the AI popup hooks
    textarea.getBoundingClientRect = () => {
      return editorContainerRef.current?.getBoundingClientRect() || new DOMRect();
    };
    
    // Update textarea with editor state
    const updateSimulatedTextarea = () => {
      if (!textarea || !editor) return;
      textarea.value = editor.getText();
      textarea.selectionStart = editor.state.selection.from;
      textarea.selectionEnd = editor.state.selection.to;
    };
    
    // Custom focus method
    textarea.focus = () => {
      editor.commands.focus('end');
    };
    
    // Update initially
    updateSimulatedTextarea();
    
    // Update on selection change and content updates
    editor.on('selectionUpdate', updateSimulatedTextarea);
    editor.on('update', updateSimulatedTextarea);
    
    return () => {
      editor.off('selectionUpdate', updateSimulatedTextarea);
      editor.off('update', updateSimulatedTextarea);
    };
  }, [editor, isBrowser]);
  
  // Handle user input through our transaction handler
  useEffect(() => {
    if (!editor) return;
    
    const handleTransaction = () => {
      if (!isUpdating) {
        // Only update if this is a user-initiated change
        const newContent = editor.getHTML();
        
        // Update the parent
        onChange(newContent);
        
        // Update our tracking variable
        setLastSetContent(newContent);
      }
    };
    
    editor.on('transaction', handleTransaction);
    
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, onChange, isUpdating]);
  
  // Handle external content changes
  useEffect(() => {
    if (!editor) return;
    
    // Get current editor content
    const currentContent = editor.getHTML();
    
    // Only update if the content is different from current and from what we last set
    if (value !== currentContent && value !== lastSetContent) {
      console.log('External content update');
      
      // Flag that we're updating programmatically
      setIsUpdating(true);
      
      // Update the editor
      editor.commands.setContent(value, false);
      
      // Update our tracking variable
      setLastSetContent(value);
      
      // Reset flag after a short delay
      setTimeout(() => {
        setIsUpdating(false);
      }, 10);
    }
  }, [editor, value, lastSetContent]);
  
  // Initialize AI Scribe functionality
  const {
    showAiPopup,
    selectedText,
    popupPosition,
    closePopup,
    selectionInfo
  } = useAiScribe(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
  // Initialize AI Write functionality
  const {
    showWritePopup,
    cursorPosition,
    closeWritePopup,
    setShowWritePopup,
    setCursorPosition
  } = useAiWrite(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
  // Set up event handlers for AI popup triggers
  useEffect(() => {
    if (!editor || !aiScribeEnabled) return;
    
    // Handle mouseup to detect text selection for AI Scribe
    const handleEditorMouseUp = (event: MouseEvent) => {
      // Skip if clicking on popups
      const target = event.target as Node;
      const scribePopup = document.querySelector('.scribe-popup');
      const writePopup = document.querySelector('.write-popup');
      const isPopupClick = scribePopup?.contains(target) || writePopup?.contains(target);
      
      if (isPopupClick) return;
      
      // Show popup for selection
      setTimeout(() => {
        if (!editor.state.selection.empty) {
          console.log('Selection detected - showing AI Scribe popup');
          
          if (simulatedTextareaRef.current) {
            const mouseEvent = new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: event.clientX,
              clientY: event.clientY
            });
            
            simulatedTextareaRef.current.dispatchEvent(mouseEvent);
          }
        }
      }, 10);
    };
    
    // Handle click to detect cursor position for AI Write
    const handleEditorClick = (event: MouseEvent) => {
      // Skip if clicking on popups
      const target = event.target as Node;
      const scribePopup = document.querySelector('.scribe-popup');
      const writePopup = document.querySelector('.write-popup');
      const isPopupClick = scribePopup?.contains(target) || writePopup?.contains(target);
      
      if (isPopupClick) return;
      
      // Show write popup for cursor position
      if (editor.state.selection.empty) {
        console.log('Cursor position detected - showing write popup');
        
        // Set cursor position directly
        setCursorPosition({
          top: event.clientY,
          left: event.clientX
        });
        
        // Show the write popup
        setShowWritePopup(true);
      }
    };
    
    // Add event listeners
    const editorContainer = editorContainerRef.current;
    if (editorContainer) {
      editorContainer.addEventListener('mouseup', handleEditorMouseUp);
      editorContainer.addEventListener('click', handleEditorClick);
    }
    
    return () => {
      if (editorContainer) {
        editorContainer.removeEventListener('mouseup', handleEditorMouseUp);
        editorContainer.removeEventListener('click', handleEditorClick);
      }
    };
  }, [editor, aiScribeEnabled, setCursorPosition, setShowWritePopup]);
  
  // Expose editor methods to parent component
  useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = {
        toggleBold: () => {
          editor.chain().focus().toggleBold().run();
        },
        toggleItalic: () => {
          editor.chain().focus().toggleItalic().run();
        },
        toggleUnderline: () => {
          editor.chain().focus().toggleUnderline().run();
        },
        setTextAlign: (align) => {
          editor.chain().focus().setTextAlign(align).run();
        },
        toggleBulletList: () => {
          editor.chain().focus().toggleBulletList().run();
        },
        toggleOrderedList: () => {
          editor.chain().focus().toggleOrderedList().run();
        },
        toggleHeading: (level) => {
          editor.chain().focus().toggleHeading({ level }).run();
        },
        undo: () => {
          editor.chain().focus().undo().run();
        },
        redo: () => {
          editor.chain().focus().redo().run();
        },
        isActive: (name, attributes) => editor.isActive(name, attributes),
        focus: () => {
          editor.commands.focus();
        },
      };
    }
    
    return () => {
      if (editorRef) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);
  
  // Handler for AI action (expand, summarize, etc.)
  const handleAiAction = async (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedContent = editor.state.doc.textBetween(from, to, ' ');
    
    console.log(`AI ${action} for: ${selectedContent}${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    try {
      // Apply a highlight to show processing area
      highlightSelection(editor, 'highlight-gray');
      
      setIsGenerating(true);
      
      // Use the content as context for the action
      const result = await generateAIContent({
        type: 'text', // Using 'text' type for all transformations
        projectId: 'placeholder-project-id', // This should be provided from props
        chapterId: 'placeholder-chapter-id', // This should be provided from props
        currentContent: `${action} the following text${instructions ? ` with instructions: ${instructions}` : ''}: ${selectedContent}`
      });
      
      // Only proceed if editor still exists and is focused
      if (editor && !editor.isDestroyed) {
        // Delete current selection
        editor.chain().focus().deleteSelection().run();
        
        // Insert the AI-generated content
        if (result && result.data && result.data.generatedContent) {
          editor.chain().insertContent(result.data.generatedContent).run();
          
          // Inform parent about the AI content if needed
          if (onAiContent) {
            onAiContent(editor.getHTML());
          }
        } else {
          // If no content was generated, restore the original text
          editor.chain().insertContent(selectedContent).run();
          console.error("AI content generation failed", result);
        }
        
        // Remove highlights
        clearAllHighlights(editor);
        
        // Ensure editor has focus
        editor.commands.focus();
      }
    } catch (error) {
      console.error(`Error generating AI content for ${action}:`, error);
      // If an error occurred, restore the selection
      if (editor && !editor.isDestroyed) {
        clearAllHighlights(editor);
      }
    } finally {
      setIsGenerating(false);
      closePopup();
    }
  };
  
  // Handle AI write at cursor position
  const handleWrite = async (instructions?: string) => {
    if (!editor) return;
    
    try {
      const position = editor.state.selection.from;
      
      setIsGenerating(true);
      const result = await generateAIContent({
        type: 'text', // Use 'text' type for general writing
        projectId: 'placeholder-project-id', // This should be provided from props
        chapterId: 'placeholder-chapter-id', // This should be provided from props
        currentContent: instructions ? `Generate text based on: ${instructions}` : 'Generate creative text'
      });
      
      // Only proceed if editor still exists and is focused
      if (editor && !editor.isDestroyed) {
        // Insert the AI-generated content at the cursor position
        if (result && result.data && result.data.generatedContent) {
          // Position cursor at the original position first
          editor.chain().focus().setTextSelection(position).run();
          
          // Insert the content
          editor.chain().insertContent(result.data.generatedContent).run();
          
          // Inform parent about the AI content if needed
          if (onAiContent) {
            onAiContent(editor.getHTML());
          }
        }
        
        // Ensure editor has focus
        editor.commands.focus();
      }
    } catch (error) {
      console.error("Error generating AI write content:", error);
    } finally {
      setIsGenerating(false);
      closeWritePopup();
    }
  };
  
  // Render popups
  const renderPopups = () => {
    if (!isBrowser) return null;
    
    return createPortal(
      <TooltipProvider>
        {/* AI Scribe Popup */}
        {showAiPopup && selectedText && (
          <AiScribePopup
            selectedText={selectedText}
            position={popupPosition}
            onAction={handleAiAction}
            onClose={closePopup}
            selectionInfo={selectionInfo}
            className="scribe-popup"
          />
        )}
        
        {/* AI Write Popup */}
        {showWritePopup && (
          <AiWritePopup
            position={cursorPosition}
            onWrite={handleWrite}
            onClose={closeWritePopup}
            className="write-popup"
          />
        )}
        
        {isGenerating && (
          <div className="fixed top-4 right-4 bg-black/75 text-white px-3 py-2 rounded-md flex items-center gap-2 z-50">
            <span className="animate-spin">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span>Generating...</span>
          </div>
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
      className={cn("tiptap-editor-container relative border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}
      onClick={(e) => {
        // Only focus if we're not already focused and not clicking on a popup
        const target = e.target as Node;
        const scribePopup = document.querySelector('.scribe-popup');
        const writePopup = document.querySelector('.write-popup');
        const isPopupClick = scribePopup?.contains(target) || writePopup?.contains(target);
        
        if (!isPopupClick && editor && !editor.isFocused) {
          console.log('Focusing editor from container click');
          // Focus the editor
          editor.commands.focus();
          
          try {
            // Try to set cursor at click position
            const view = editor.view;
            const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
            
            if (pos) {
              editor.commands.setTextSelection(pos.pos);
            }
          } catch (error) {
            console.warn('Error positioning cursor:', error);
          }
        }
      }}
    >
      <EditorContent 
        className="min-h-[200px] w-full overflow-auto"
        editor={editor} 
      />
      {renderPopups()}
    </div>
  );
}

AiEnhancedTipTapEditor.displayName = "AiEnhancedTipTapEditor"; 