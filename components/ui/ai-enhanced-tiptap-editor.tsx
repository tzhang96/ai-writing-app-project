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
  
  // Popup reference to check if clicks are on the popup
  const popupRef = useRef<HTMLDivElement | null>(null);
  
  // State to track if we're in a browser environment (for SSR compatibility)
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Track if the highlight should be preserved during popup interaction
  const preserveHighlight = useRef(false);
  
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
    },
  });
  
  // Create a textarea ref simulation for AI features
  const simulatedTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // This effect creates and updates a simulated textarea element for compatibility
  // with the existing AI popup logic which expects a textarea
  useEffect(() => {
    if (!editor || !editorContainerRef.current) return;
    
    console.log('Creating simulated textarea for AI features');
    
    // Create a simulated textarea that will never be rendered
    if (!simulatedTextareaRef.current) {
      simulatedTextareaRef.current = document.createElement('textarea');
      console.log('Created new simulated textarea element');
    }
    
    // Update the simulated textarea with editor content
    const textarea = simulatedTextareaRef.current;
    textarea.value = editor.getText();
    
    console.log('Updated textarea with text:', { value: textarea.value.substring(0, 50) + (textarea.value.length > 50 ? '...' : '') });
    
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
    
    console.log('Simulated textarea ready for AI popups');
    
    return () => {
      // Clean up if needed
    };
  }, [editor]);
  
  // Handle text selection for AI Scribe
  useEffect(() => {
    if (!editor || !aiScribeEnabled) return;
    
    console.log('Setting up selection handling in editor');
    
    // Create a special handler for our direct mouseup events on the editor
    const simulateSelectionForAiScribe = (originalEvent?: MouseEvent) => {
      if (!editor.isFocused || editor.view.state.selection.empty) {
        console.log('No selection in editor - skipping');
        return;
      }
      
      console.log('Selection detected in editor, simulating for textarea');
      
      // Update the textarea for the AI popup
      if (simulatedTextareaRef.current) {
        // Important: Set the value FIRST before setting selection indices
        simulatedTextareaRef.current.value = editor.getText();
        
        const start = editor.state.selection.from;
        const end = editor.state.selection.to;
        
        simulatedTextareaRef.current.selectionStart = start;
        simulatedTextareaRef.current.selectionEnd = end;
        
        console.log('Dispatching mouseup to textarea with selection', { 
          value: editor.getText().substring(start, end),
          start,
          end,
          mousePosition: originalEvent ? { x: originalEvent.clientX, y: originalEvent.clientY } : 'No mouse position'
        });
        
        // This is the crucial part - dispatch a mouseup event to the textarea
        // to trigger the useAiScribe hook's handleTextSelection function
        const mouseEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          // Include original mouse position if available
          clientX: originalEvent ? originalEvent.clientX : 0,
          clientY: originalEvent ? originalEvent.clientY : 0,
          screenX: originalEvent ? originalEvent.screenX : 0,
          screenY: originalEvent ? originalEvent.screenY : 0,
          button: 0,
          buttons: 0
        });
        
        // Add a short delay to ensure proper event order
        setTimeout(() => {
          simulatedTextareaRef.current?.dispatchEvent(mouseEvent);
        }, 50);
      } else {
        console.log('No simulated textarea reference');
      }
    };
    
    // Listen for mouseup on the editor container to handle text selections
    const handleEditorMouseUp = (event: MouseEvent) => {
      console.log('Editor mouseup event detected');
      
      // Skip if clicking on popups
      const target = event.target as Node;
      const scribePopup = document.querySelector('.scribe-popup');
      const writePopup = document.querySelector('.write-popup');
      const isPopupClick = scribePopup?.contains(target) || writePopup?.contains(target);
      
      if (isPopupClick) {
        console.log('Click on popup - skipping');
        return;
      }
      
      // Small delay to ensure selection is complete
      setTimeout(() => {
        // Pass the original mouse event to preserve its position
        simulateSelectionForAiScribe(event);
      }, 10);
    };
    
    // Handle click for AI Write
    const handleEditorClick = (event: MouseEvent) => {
      console.log('Editor click event detected');
      
      // Skip if clicking on popups
      const target = event.target as Node;
      const scribePopup = document.querySelector('.scribe-popup');
      const writePopup = document.querySelector('.write-popup');
      const isPopupClick = scribePopup?.contains(target) || writePopup?.contains(target);
      
      if (isPopupClick) {
        console.log('Click on popup - skipping write popup');
        return;
      }
      
      // Only proceed if selection is empty (cursor position)
      if (!editor.view.state.selection.empty) {
        console.log('Selection not empty - skipping write popup');
        return;
      }
      
      console.log('Empty selection (cursor position) detected - showing write popup');
      
      // Simulate cursor click on the textarea
      if (simulatedTextareaRef.current) {
        simulatedTextareaRef.current.value = editor.getText();
        simulatedTextareaRef.current.selectionStart = editor.state.selection.from;
        simulatedTextareaRef.current.selectionEnd = editor.state.selection.from;
        
        console.log('Dispatching click to textarea for write popup', {
          position: editor.state.selection.from
        });
        
        // Create a click event on the textarea
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: event.clientX,
          clientY: event.clientY
        });
        
        // Add a short delay to ensure proper event order
        setTimeout(() => {
          simulatedTextareaRef.current?.dispatchEvent(clickEvent);
        }, 50);
      } else {
        console.log('No simulated textarea reference for write popup');
      }
    };
    
    const editorContainer = editorContainerRef.current;
    if (editorContainer) {
      console.log('Adding event listeners to editor container');
      editorContainer.addEventListener('mouseup', handleEditorMouseUp);
      editorContainer.addEventListener('click', handleEditorClick);
    } else {
      console.warn('No editor container reference found');
    }
    
    return () => {
      console.log('Cleaning up event listeners');
      if (editorContainer) {
        editorContainer.removeEventListener('mouseup', handleEditorMouseUp);
        editorContainer.removeEventListener('click', handleEditorClick);
      }
    };
  }, [editor, aiScribeEnabled]);
  
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
    closeWritePopup,
    setShowWritePopup,
    setCursorPosition
  } = useAiWrite(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
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
  
  // Handle AI generated content
  const handleAiGeneratedContent = (newContent: string) => {
    if (onAiContent) {
      onAiContent(newContent);
    } else if (editor) {
      // No need to clear highlights since they're disabled
      
      // Store the current cursor position
      const insertPos = editor.state.selection.from;
      
      // Insert content at cursor position
      editor.commands.insertContent(newContent);
      
      // Calculate new selection range based on inserted content length
      const newFrom = insertPos;
      const newTo = insertPos + newContent.length;
      
      // Select the new content (without highlighting)
      editor.commands.setTextSelection({ from: newFrom, to: newTo });
      
      // Focus editor after content insertion
      setTimeout(() => {
        editor.commands.focus();
      }, 0);
    }
  };
  
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
  
  // Separate effect for handling write popup trigger
  useEffect(() => {
    if (!editor || !aiScribeEnabled) return;
    
    const handleClick = (event: MouseEvent) => {
      // Only proceed if no popups are active
      if (showAiPopup || showWritePopup) return;
      
      const target = event.target as Node;
      const isEditorClick = editorContainerRef.current?.contains(target);
      
      // Check if we should show the write popup for cursor placement
      if (isEditorClick && editor.view.state.selection.empty && aiScribeEnabled) {
        // Simulate a cursor click at the current position
        const cursorPosition = {
          top: event.clientY,
          left: event.clientX
        };
        setCursorPosition(cursorPosition);
        setShowWritePopup(true);
      }
    };
    
    document.addEventListener("click", handleClick);
    
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [editor, showAiPopup, showWritePopup, aiScribeEnabled, setCursorPosition, setShowWritePopup]);
  
  // Render popups in a portal with proper class names for identification
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