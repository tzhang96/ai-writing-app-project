"use client";

import React, { useRef } from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { 
  AiScribePopup, 
  AiWritePopup, 
  useAiScribe, 
  useAiWrite 
} from "@/components/ai-scribe-popup";

export interface AiEnhancedTextareaProps extends TextareaProps {
  aiScribeEnabled: boolean;
  onAiContent?: (newContent: string) => void;
}

export const AiEnhancedTextarea = React.forwardRef<HTMLTextAreaElement, AiEnhancedTextareaProps>(
  ({ aiScribeEnabled, onAiContent, className, ...props }, forwardedRef) => {
    // Create local ref if one is not provided
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef || innerRef) as React.RefObject<HTMLTextAreaElement>;
    
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
    
    return (
      <>
        <Textarea
          ref={textareaRef}
          className={className}
          {...props}
        />
        
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
      </>
    );
  }
);

AiEnhancedTextarea.displayName = "AiEnhancedTextarea"; 