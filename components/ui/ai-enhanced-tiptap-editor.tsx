"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import PersistentHighlight from "./extensions/PersistentHighlight";
import { highlightSelection, clearAllHighlights, addHighlight } from "./extensions/highlightUtils";
import '@/styles/tiptap.css'; // Import TipTap styling

export interface AiEnhancedTipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  aiScribeEnabled: boolean;
  onAiContent?: (content: string, title?: string) => void;
  chapterId?: string;
  projectId?: string;
  contentType?: 'note' | 'beat' | 'text';
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

// Types for our AI operations
type AIAction = 'expand' | 'summarize' | 'rephrase' | 'revise';

interface AITransformationRequest {
  text: string;
  action: AIAction;
  additionalInstructions?: string;
  fullDocument?: string;
  chapterId?: string;
  projectId?: string;
  contentType?: 'note' | 'beat' | 'text';
}

interface AIGenerateContentRequest {
  type: string;
  chapterId: string;
  projectId: string;
  currentContent: string;
}

interface AIGenerateContentResponse {
  generatedContent: string;
}

export function AiEnhancedTipTapEditor({
  value,
  onChange,
  className,
  placeholder = "Start writing...",
  aiScribeEnabled,
  onAiContent,
  chapterId,
  projectId,
  contentType = 'text',
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
    closePopup: originalClosePopup,
    selectionInfo
  } = useAiScribe(simulatedTextareaRef as React.RefObject<HTMLTextAreaElement>, aiScribeEnabled);
  
  // Add state for tracking selected range for highlighting
  const selectedRange = useRef<{ from: number, to: number } | null>(null);
  
  // Override closePopup to handle highlights
  const closePopup = useCallback(() => {
    // Reset the stored selection range
    selectedRange.current = null;
    
    // Clear highlights when popup is closed
    if (editor) {
      clearAllHighlights(editor);
    }
    
    // Call the original closePopup
    originalClosePopup();
  }, [editor, originalClosePopup]);
  
  // Apply highlight when the popup is shown
  useEffect(() => {
    if (showAiPopup && editor && selectedRange.current) {
      const { from, to } = selectedRange.current;
      clearAllHighlights(editor);
      addHighlight(editor, from, to, 'highlight-gray');
    }
  }, [showAiPopup, editor]);
  
  // Function to apply highlight to current selection
  const applyHighlightToSelection = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from === to) return; // No selection
    
    // Store the selection range
    selectedRange.current = { from, to };
    
    // Apply highlight
    clearAllHighlights(editor);
    addHighlight(editor, from, to, 'highlight-gray');
    
    // Force editor to update
    editor.view.dispatch(editor.state.tr);
  }, [editor]);

  // Add event listeners to detect when popup appears
  useEffect(() => {
    // Only run if popups are enabled and editor exists
    if (!editor || !aiScribeEnabled) return;
    
    // Listen for when popup becomes visible
    const handlePopupVisible = () => {
      if (showAiPopup) {
        // Apply highlight when popup appears
        applyHighlightToSelection();
      } else {
        // Clear highlight when popup disappears
        if (editor) {
          clearAllHighlights(editor);
        }
      }
    };
    
    // Watch for popup state changes
    handlePopupVisible();
    
    return () => {
      // Clean up highlights when unmounting
      if (editor) {
        clearAllHighlights(editor);
      }
    };
  }, [showAiPopup, editor, aiScribeEnabled, applyHighlightToSelection]);
  
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

      // Show popup for selection after short delay to ensure selection is complete
      setTimeout(() => {
        if (!editor.state.selection.empty) {
          console.log('Selection detected - showing AI Scribe popup');
          
          // Store the selection range for highlighting
          const { from, to } = editor.state.selection;
          selectedRange.current = { from, to };
          
          // Update the simulated textarea value with the selected text
          const selectedContent = editor.state.doc.textBetween(from, to, ' ');
          if (simulatedTextareaRef.current) {
            simulatedTextareaRef.current.value = selectedContent;
            simulatedTextareaRef.current.selectionStart = 0;
            simulatedTextareaRef.current.selectionEnd = selectedContent.length;
          }
          
          // Calculate popup position based on selection
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Trigger the simulated textarea event to show the popup
            if (simulatedTextareaRef.current) {
              const mouseEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: rect.right,
                clientY: rect.bottom
              });
              
              simulatedTextareaRef.current.dispatchEvent(mouseEvent);
            }
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

      // Show write popup for cursor position when we have an empty selection (just a cursor)
      if (editor.view.hasFocus() && editor.state.selection.empty) {
        console.log('Cursor position detected - showing AI Write popup');
        
        // Set cursor position for the popup
        setCursorPosition({
          top: event.clientY,
          left: event.clientX
        });
        
        // Show the popup
        setShowWritePopup(true);
      }
    };

    // Add event listeners
    const editorDOM = editor.view.dom;
    editorDOM.addEventListener('mouseup', handleEditorMouseUp);
    editorDOM.addEventListener('click', handleEditorClick);

    return () => {
      editorDOM.removeEventListener('mouseup', handleEditorMouseUp);
      editorDOM.removeEventListener('click', handleEditorClick);
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
    
    // Use stored selection range if available, otherwise use current selection
    const selRange = selectedRange.current || editor.state.selection;
    const { from, to } = selRange;
    const selectedContent = editor.state.doc.textBetween(from, to, ' ');
    
    console.log(`AI ${action} for: ${selectedContent}${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    try {
      // Apply a highlight to show processing area
      if (selectedRange.current) {
        clearAllHighlights(editor);
        addHighlight(editor, from, to, 'highlight-processing');
      } else {
        highlightSelection(editor, 'highlight-processing');
      }
      
      setIsGenerating(true);
      
      // Get Firebase functions instance
      const functions = getFunctions(getApp());
      
      // Create a callable reference to our Cloud Function
      const transformText = httpsCallable<AITransformationRequest, { success: boolean; transformedText: string }>(
        functions,
        'transformText'
      );
      
      // Call the Cloud Function
      const result = await transformText({
        text: selectedContent,
        action: action as AIAction,
        additionalInstructions: instructions,
        fullDocument: editor.getText(),
        chapterId,
        projectId,
        contentType
      });
      
      // Only proceed if editor still exists
      if (editor && !editor.isDestroyed) {
        // Clear the processing highlight
        clearAllHighlights(editor);
        
        if (result.data.success) {
          // Remember insertion position for highlighting result
          const insertionPos = from;
          
          // Replace the selected content with the transformed text
          editor.chain()
            .focus()
            .deleteSelection()
            .insertContent(result.data.transformedText)
            .run();
          
          // Calculate the end position of the inserted text
          const newTo = insertionPos + result.data.transformedText.length;
          
          // Highlight the result temporarily
          addHighlight(editor, insertionPos, newTo, 'highlight-success');
          
          // Select the transformed text
          editor.chain().setTextSelection({ from: insertionPos, to: newTo }).run();
          
          // Reset the stored selection range
          selectedRange.current = null;
          
          // Clear the highlight after a short delay
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              clearAllHighlights(editor);
            }
          }, 1500);
          
          // If a callback is provided, use it
          if (onAiContent) {
            onAiContent(editor.getHTML());
          }
        } else {
          console.error('Failed to transform text');
        }
      }
    } catch (error) {
      console.error('Error transforming text:', error);
      
      // Clean up highlight on error
      if (editor && !editor.isDestroyed) {
        clearAllHighlights(editor);
      }
    } finally {
      setIsGenerating(false);
      closePopup(); // Close popup after action completes
    }
  };
  
  // Handle AI write at cursor position
  const handleWrite = async (instructions?: string) => {
    if (!editor) return;
    
    try {
      const position = editor.state.selection.from;
      
      setIsGenerating(true);
      console.log('AI Write triggered with:', {
        contentType,
        chapterId,
        projectId,
        instructions,
        currentContent: editor.getText().substring(0, 100) + '...'
      });
      
      // Get Firebase functions instance
      const functions = getFunctions(getApp());
      
      // Create a callable reference to our Cloud Function
      const generateAIContent = httpsCallable<AIGenerateContentRequest, AIGenerateContentResponse>(
        functions,
        'generateAIContent'
      );
      
      // Call the Cloud Function with proper context
      console.log('Calling generateAIContent with:', {
        type: contentType || 'text',
        chapterId: chapterId || '',
        projectId: projectId || ''
      });
      
      const result = await generateAIContent({
        type: contentType || 'text',
        chapterId: chapterId || '',
        projectId: projectId || '',
        currentContent: editor.getText()
      });
      
      console.log('Received AI response:', {
        success: !!result.data.generatedContent,
        contentType,
        responseLength: result.data.generatedContent?.length
      });
      
      // Only proceed if editor still exists and is focused
      if (editor && !editor.isDestroyed && result.data.generatedContent) {
        // For beats and notes, parse the title and content
        if (contentType === 'beat' || contentType === 'note') {
          const response = result.data.generatedContent;
          console.log('Attempting to parse note/beat response:', response);
          
          const titleMatch = response.match(/TITLE:\s*(.*)/);
          const contentMatch = response.match(/CONTENT:\s*(.*)/);
          
          console.log('Parsed matches:', { titleMatch, contentMatch });
          
          if (titleMatch && contentMatch) {
            const title = titleMatch[1].trim();
            const content = contentMatch[1].trim();
            
            console.log('Successfully parsed title and content:', { title, content });
            
            // If we have a callback, pass both title and content
            if (onAiContent) {
              console.log('Calling onAiContent with:', { content, title });
              onAiContent(content, title);
              return;
            }
          } else {
            console.warn('Failed to parse title/content from response');
          }
        }
        
        // For regular text or if parsing fails, just insert the content
        console.log('Inserting content directly into editor');
        
        // Position cursor at insertion point
        editor.chain().focus().setTextSelection(position).run();
        
        // Store insertion position for highlighting
        const insertPos = position;
        
        // Insert the generated content
        editor.chain().insertContent(result.data.generatedContent).run();
        
        // Calculate the end position of the inserted text
        const newTo = insertPos + result.data.generatedContent.length;
        
        // Highlight the inserted content temporarily
        addHighlight(editor, insertPos, newTo, 'highlight-success');
        
        // Select the inserted text
        editor.chain().setTextSelection({ from: insertPos, to: newTo }).run();
        
        // Clear the highlight after a short delay
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            clearAllHighlights(editor);
          }
        }, 1500);
        
        // If a callback is provided, use it
        if (onAiContent) {
          onAiContent(editor.getHTML());
        }
      } else {
        console.error('No content generated or editor not available:', {
          editorExists: !!editor,
          editorDestroyed: editor?.isDestroyed,
          hasContent: !!result.data.generatedContent
        });
      }
    } catch (error) {
      console.error('Error in handleWrite:', error);
    } finally {
      setIsGenerating(false);
      closeWritePopup(); // Close popup after operation completes
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
            onAction={(action, instructions) => {
              // When an action is triggered, use the stored selection
              handleAiAction(action, instructions);
            }}
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
      className={cn("tiptap-editor-container relative border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", 
        editor.isFocused ? "ring-2 ring-offset-1 ring-primary/10" : "",
        className
      )}
    >
      <EditorContent 
        className="prose max-w-none w-full min-h-[200px] p-4" 
        editor={editor} 
      />
      {renderPopups()}
    </div>
  );
}

AiEnhancedTipTapEditor.displayName = "AiEnhancedTipTapEditor"; 