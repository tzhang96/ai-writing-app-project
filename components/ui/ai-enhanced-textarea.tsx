"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { 
  AiScribePopup, 
  AiWritePopup, 
  useAiScribe, 
  useAiWrite 
} from "@/components/ai-scribe-popup";
import { TooltipProvider } from "@/components/ui/tooltip";
import { generateAIContent } from '@/lib/services/ai';
import { Loader2 } from 'lucide-react';

export interface AiEnhancedTextareaProps extends TextareaProps {
  aiScribeEnabled: boolean;
  onAiContent?: (content: string, title?: string) => void;
  chapterId?: string;
  projectId?: string;
  contentType?: 'note' | 'beat' | 'text';
}

export const AiEnhancedTextarea = React.forwardRef<HTMLTextAreaElement, AiEnhancedTextareaProps>(
  ({ aiScribeEnabled, onAiContent, className, chapterId, projectId, contentType, ...props }, forwardedRef) => {
    // Create local ref if one is not provided
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef || innerRef) as React.RefObject<HTMLTextAreaElement>;
    
    // State to track if we're in a browser environment (for SSR compatibility)
    const [isBrowser, setIsBrowser] = React.useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Set isBrowser to true on component mount
    React.useEffect(() => {
      setIsBrowser(true);
    }, []);
    
    // Initialize AI Scribe functionality
    const {
      showAiPopup,
      selectedText,
      popupPosition,
      handleAiAction,
      closePopup,
      selectionInfo
    } = useAiScribe(textareaRef, aiScribeEnabled);
    
    // Initialize AI Write functionality
    const {
      showWritePopup,
      cursorPosition,
      handleWrite,
      closeWritePopup
    } = useAiWrite(textareaRef, aiScribeEnabled);
    
    // Handle AI generated content
    const handleAiGeneratedContent = (newContent: string) => {
      if (onAiContent) {
        onAiContent(newContent);
      } else if (textareaRef.current) {
        // Get the current selection range
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentValue = textareaRef.current.value;
        
        // Replace the selected text with the new content
        const newValue = currentValue.substring(0, start) + newContent + currentValue.substring(end);
        
        // Create a synthetic event to update the value
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: newValue }
        });
        
        // Update the textarea value
        textareaRef.current.value = newValue;
        
        // Dispatch the event if there's an onChange handler
        if (props.onChange) {
          props.onChange(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        }
        
        // Focus and set cursor position after content update
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPosition = start + newContent.length;
            textareaRef.current.selectionStart = newCursorPosition;
            textareaRef.current.selectionEnd = newCursorPosition;
          }
        }, 0);
      }
    };
    
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
              onAction={async (action, transformedText) => {
                try {
                  console.log('Original selection:', selectedText);
                  console.log('Transformed text:', transformedText);
                  
                  if (textareaRef.current && selectionInfo) {
                    const { start, end } = selectionInfo;
                    const currentValue = textareaRef.current.value;
                    
                    console.log('Selection range:', { start, end });
                    console.log('Text being replaced:', currentValue.substring(start, end));
                    
                    // Replace the selected text with the transformed text
                    const newValue = currentValue.substring(0, start) + transformedText + currentValue.substring(end);
                    
                    // Update the textarea value directly
                    textareaRef.current.value = newValue;
                    
                    // Create and dispatch the input event
                    const event = new Event('input', { bubbles: true });
                    Object.defineProperty(event, 'target', {
                      writable: false,
                      value: { value: newValue }
                    });
                    
                    if (props.onChange) {
                      props.onChange(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
                    }
                    
                    // Set cursor position after the transformed text
                    const newCursorPosition = start + transformedText.length;
                    textareaRef.current.selectionStart = newCursorPosition;
                    textareaRef.current.selectionEnd = newCursorPosition;
                    
                    // Focus the textarea
                    textareaRef.current.focus();
                  }
                  
                  closePopup();
                } catch (error) {
                  console.error('Error in AI transformation:', error);
                }
              }}
              onClose={closePopup}
              selectionInfo={selectionInfo}
            />
          )}
          
          {/* AI Write Popup */}
          {showWritePopup && (
            <AiWritePopup
              position={cursorPosition}
              onWrite={async (instructions) => {
                handleWrite(instructions);
                
                if (!chapterId || !projectId || !contentType) {
                  console.error('Missing required parameters for AI generation');
                  return;
                }

                setIsGenerating(true);
                try {
                  const result = await generateAIContent({
                    type: contentType,
                    chapterId,
                    projectId,
                    currentContent: textareaRef.current?.value
                  });
                  
                  if (contentType === 'note' || contentType === 'beat') {
                    const { title, content } = JSON.parse(result.data.generatedContent);
                    // For notes and beats, we'll emit both title and content
                    if (onAiContent) {
                      onAiContent(content, title);
                    } else {
                      handleAiGeneratedContent(content);
                    }
                  } else {
                    // For regular text, just use the content directly
                    handleAiGeneratedContent(result.data.generatedContent);
                  }
                } catch (error) {
                  console.error('Error generating AI content:', error);
                  handleAiGeneratedContent('[Error generating AI content]');
                } finally {
                  setIsGenerating(false);
                }
              }}
              onClose={closeWritePopup}
            />
          )}
        </TooltipProvider>,
        document.body
      );
    };
    
    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          className={className}
          {...props}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-background p-2 rounded-md shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating content...</span>
            </div>
          </div>
        )}
        {renderPopups()}
      </div>
    );
  }
);

AiEnhancedTextarea.displayName = "AiEnhancedTextarea"; 