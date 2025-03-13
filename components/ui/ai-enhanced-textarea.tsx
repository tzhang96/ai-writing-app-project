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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export interface AiEnhancedTextareaProps extends TextareaProps {
  aiScribeEnabled: boolean;
  onAiContent?: (content: string, title?: string) => void;
  chapterId?: string;
  projectId?: string;
  contentType?: 'note' | 'beat' | 'text';
}

// Types for our AI operations
type AIAction = 'expand' | 'summarize' | 'rephrase' | 'revise';

interface AITransformationRequest {
  text: string;
  action: AIAction;
  additionalInstructions?: string;
  fullDocument?: string;
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

export const AiEnhancedTextarea = React.forwardRef<HTMLTextAreaElement, AiEnhancedTextareaProps>(
  ({ aiScribeEnabled, onAiContent, className, chapterId, projectId, contentType, ...props }, forwardedRef) => {
    // Create local ref if one is not provided
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef || innerRef) as React.RefObject<HTMLTextAreaElement>;
    
    // State to track if we're in a browser environment (for SSR compatibility)
    const [isBrowser, setIsBrowser] = React.useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    
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
        // Default implementation if no callback is provided
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentValue = textareaRef.current.value;
        
        const newValue = currentValue.substring(0, start) + 
                        newContent + 
                        currentValue.substring(end);
        
        // Create a synthetic event to update the value
        const event = new Event('input', { bubbles: true });
        
        // Update the value
        Object.defineProperty(event, 'target', {
          writable: false,
          value: { value: newValue }
        });
        
        if (props.onChange) {
          props.onChange(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        }
        
        // Focus and set cursor position after content update
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = start + newContent.length;
            textareaRef.current.selectionEnd = start + newContent.length;
          }
        }, 0);
      }
    };
    
    const handleGenerateContent = async () => {
      if (!textareaRef.current) return;
      
      setIsGenerating(true);
      setError(null);
      
      try {
        console.log('AI Write triggered with:', {
          contentType,
          chapterId,
          projectId,
          currentContent: textareaRef.current.value
        });
        
        // Get Firebase functions instance
        const functions = getFunctions(getApp());
        
        // Create a callable reference to our Cloud Function
        const generateAIContent = httpsCallable<AIGenerateContentRequest, AIGenerateContentResponse>(
          functions,
          'generateAIContent'
        );
        
        // Call the Cloud Function
        console.log('Calling generateAIContent with:', {
          type: contentType || 'text',
          chapterId: chapterId || '',
          projectId: projectId || ''
        });
        
        const result = await generateAIContent({
          type: contentType || 'text',
          chapterId: chapterId || '',
          projectId: projectId || '',
          currentContent: textareaRef.current.value
        });
        
        console.log('Received AI response:', {
          success: !!result.data.generatedContent,
          contentType,
          responseLength: result.data.generatedContent?.length,
          response: result.data.generatedContent
        });
        
        if (result.data.generatedContent) {
          // For beats and notes, parse the title and content
          if (contentType === 'beat' || contentType === 'note') {
            const response = result.data.generatedContent;
            console.log('Attempting to parse note/beat response:', response);
            
            try {
              // Try parsing the response as JSON
              const parsed = JSON.parse(response);
              console.log('Parsed JSON:', parsed);
              
              if (parsed.title && parsed.content) {
                console.log('Found title and content in JSON:', { title: parsed.title, content: parsed.content });
                if (onAiContent) {
                  onAiContent(parsed.content, parsed.title);
                  return;
                }
              } else {
                console.warn('JSON parsed but missing title or content:', parsed);
              }
            } catch (e) {
              console.warn('Failed to parse JSON, trying regex:', e);
              // If JSON parsing fails, try regex as fallback
              const titleMatch = response.match(/TITLE:\s*(.*)/);
              const contentMatch = response.match(/CONTENT:\s*(.*)/);
              
              if (titleMatch && contentMatch) {
                const title = titleMatch[1].trim();
                const content = contentMatch[1].trim();
                
                if (onAiContent) {
                  onAiContent(content, title);
                  return;
                }
              } else {
                console.warn('Failed to find title/content with regex');
              }
            }
          }
          
          // For regular text or if parsing fails, just use the content directly
          handleAiGeneratedContent(result.data.generatedContent);
        } else {
          throw new Error('No content generated');
        }
      } catch (error) {
        console.error('Error generating content:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsGenerating(false);
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
              onAction={(action, instructions) => {
                // Instead of calling the old handleAiAction, we'll use the new transformText function directly
                // But first close the popup to maintain the original UX
                closePopup();
                
                // Then call the Firebase function
                const generateTransformedText = async () => {
                  try {
                    // Get Firebase functions instance
                    const functions = getFunctions(getApp());
                    
                    // Create a callable reference to our Cloud Function
                    const transformText = httpsCallable<AITransformationRequest, { success: boolean; transformedText: string }>(
                      functions,
                      'transformText'
                    );
                    
                    // Call the Cloud Function
                    const result = await transformText({
                      text: selectedText,
                      action: action as AIAction,
                      additionalInstructions: instructions,
                      fullDocument: textareaRef.current?.value
                    });
                    
                    if (result.data.success) {
                      // Use the transformed text
                      handleAiGeneratedContent(result.data.transformedText);
                    } else {
                      console.error('Failed to transform text');
                    }
                  } catch (error) {
                    console.error('Error transforming text:', error);
                  }
                };
                
                // Execute the async function
                generateTransformedText();
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
                // Close the popup first to maintain the original UX
                closeWritePopup();
                
                if (!instructions) return;
                
                setIsGenerating(true);
                try {
                  // Get Firebase functions instance
                  const functions = getFunctions(getApp());
                  
                  // Create a callable reference to our Cloud Function
                  const generateAIContent = httpsCallable<AIGenerateContentRequest, AIGenerateContentResponse>(
                    functions,
                    'generateAIContent'
                  );
                  
                  // Call the Cloud Function
                  const result = await generateAIContent({
                    type: contentType || 'text',
                    chapterId: chapterId || '',
                    projectId: projectId || '',
                    currentContent: textareaRef.current?.value || ''
                  });
                  
                  if (result.data.generatedContent) {
                    // For beats and notes, parse the title and content
                    if (contentType === 'beat' || contentType === 'note') {
                      const response = result.data.generatedContent;
                      
                      // Try parsing as JSON first
                      try {
                        const parsed = JSON.parse(response);
                        if (parsed.title && parsed.content) {
                          if (onAiContent) {
                            onAiContent(parsed.content, parsed.title);
                            return;
                          }
                        }
                      } catch (e) {
                        // If JSON parsing fails, try regex
                        const titleMatch = response.match(/TITLE:\s*(.*)/);
                        const contentMatch = response.match(/CONTENT:\s*(.*)/);
                        
                        if (titleMatch && contentMatch) {
                          const title = titleMatch[1].trim();
                          const content = contentMatch[1].trim();
                          
                          if (onAiContent) {
                            onAiContent(content, title);
                            return;
                          }
                        }
                      }
                    }
                    
                    // For regular text or if parsing fails, just use the content directly
                    handleAiGeneratedContent(result.data.generatedContent);
                  } else {
                    throw new Error('No content generated');
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
      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          className={cn('min-h-[150px] resize-none', className)}
          {...props}
        />
        
        {renderPopups()}
      </div>
    );
  }
);

AiEnhancedTextarea.displayName = "AiEnhancedTextarea"; 