"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wand2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Edit 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiScribePopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onAction: (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => void;
  onClose: () => void;
}

export function AiScribePopup({ selectedText, position, onAction, onClose }: AiScribePopupProps) {
  const [instructions, setInstructions] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const [isPositionedAbove, setIsPositionedAbove] = useState(false);
  
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = position.top;
      let left = position.left;
      let positionedAbove = false;
      
      // Adjust horizontal position if needed
      if (left + rect.width > viewportWidth - 20) {
        left = Math.max(20, viewportWidth - rect.width - 20);
      }
      
      // Adjust vertical position if needed
      if (top + rect.height > viewportHeight - 20) {
        // Position above the selection instead of below
        top = Math.max(10, position.top - rect.height - 10); // Reduced offset when positioned above
        positionedAbove = true;
      }
      
      setIsPositionedAbove(positionedAbove);
      
      // Apply position
      if (popupRef.current) {
        popupRef.current.style.top = `${top}px`;
        popupRef.current.style.left = `${left}px`;
      }
    }
  }, [position]);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleAction = (action: 'expand' | 'summarize' | 'rephrase' | 'revise') => {
    onAction(action, instructions);
  };
  
  return (
    <TooltipProvider>
      <div 
        ref={popupRef}
        className="fixed z-[100] shadow-lg rounded-lg bg-background border"
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
          width: '330px',
          transform: isPositionedAbove ? 'translate(0, -15px)' : 'translate(0, 5px)'
        }}
      >
        <div className="p-3">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-6 text-xs px-2 py-0 w-full flex items-center justify-center gap-1"
                  onClick={() => handleAction('expand')}
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Expand</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Make the text longer or more detailed</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-6 text-xs px-2 py-0 w-full flex items-center justify-center gap-1"
                  onClick={() => handleAction('summarize')}
                >
                  <Minimize2 className="h-3 w-3" />
                  <span>Summarize</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a shorter version of the text</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-6 text-xs px-2 py-0 w-full flex items-center justify-center gap-1"
                  onClick={() => handleAction('rephrase')}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Rephrase</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rewrite the text in a different way</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-6 text-xs px-2 py-0 w-full flex items-center justify-center gap-1"
                  onClick={() => handleAction('revise')}
                >
                  <Edit className="h-3 w-3" />
                  <span>Revise</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fix issues with the text</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <Input 
            placeholder="Additional instructions (optional)"
            className="text-xs h-7 w-full"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

export function useAiScribe(textareaRef: React.RefObject<HTMLTextAreaElement>, aiScribeEnabled: boolean) {
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  const handleTextSelection = () => {
    if (!aiScribeEnabled) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const selectedText = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    );
    
    if (selectedText && selectedText.trim().length > 0) {
      // Get the textarea's position and the selection coordinates
      const textareaRect = textarea.getBoundingClientRect();
      
      // Calculate the position of the selection within the textarea
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      
      // Create a range to measure where the selection is
      const textBeforeSelection = textarea.value.substring(0, selectionStart);
      const selectedTextValue = textarea.value.substring(selectionStart, selectionEnd);
      
      // Create a temporary element to measure text dimensions
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'pre-wrap';
      tempElement.style.width = `${textareaRect.width}px`;
      tempElement.style.fontSize = window.getComputedStyle(textarea).fontSize;
      tempElement.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
      tempElement.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
      tempElement.style.padding = window.getComputedStyle(textarea).padding;
      
      // Add the text before selection and a span for the selection
      tempElement.innerHTML = textBeforeSelection.replace(/\n/g, '<br>') + 
                             '<span id="selection">' + 
                             selectedTextValue.replace(/\n/g, '<br>') + 
                             '</span>';
      
      document.body.appendChild(tempElement);
      
      // Get the position of the selection span
      const selectionSpan = tempElement.querySelector('#selection');
      if (selectionSpan) {
        const selectionRect = selectionSpan.getBoundingClientRect();
        
        // Calculate the position for the popup
        const top = textareaRect.top + selectionRect.top - tempElement.getBoundingClientRect().top + selectionRect.height;
        const left = textareaRect.left + selectionRect.left - tempElement.getBoundingClientRect().left;
        
        setSelectedText(selectedText);
        setPopupPosition({
          top: top + window.scrollY,
          left: left + window.scrollX
        });
        setShowAiPopup(true);
      }
      
      // Clean up
      document.body.removeChild(tempElement);
    } else {
      setShowAiPopup(false);
    }
  };
  
  useEffect(() => {
    if (aiScribeEnabled) {
      document.addEventListener('mouseup', handleTextSelection);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [aiScribeEnabled]);
  
  const handleAiAction = (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => {
    // Here we would integrate with the AI to process the selected text
    console.log(`AI ${action} for: ${selectedText}${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    // For now, we'll just close the popup
    setShowAiPopup(false);
  };
  
  const closePopup = () => {
    setShowAiPopup(false);
  };
  
  return {
    showAiPopup,
    selectedText,
    popupPosition,
    handleAiAction,
    closePopup
  };
} 