"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wand2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Edit,
  PenLine,
  Loader2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Types for our AI operations
type AIAction = 'expand' | 'summarize' | 'rephrase' | 'revise';

interface AITransformationRequest {
  text: string;
  action: AIAction;
  additionalInstructions?: string;
  fullDocument?: string;
}

// Create a shared context for popup state management
type PopupType = 'none' | 'scribe' | 'write';
const popupState: { 
  current: PopupType;
  setPopupType: (type: PopupType) => void;
  listeners: (() => void)[];
} = {
  current: 'none',
  setPopupType: (type) => {
    popupState.current = type;
    // Notify all listeners of the state change
    popupState.listeners.forEach(listener => listener());
  },
  listeners: []
};

// Helper function to add listeners
function addPopupStateListener(listener: () => void) {
  popupState.listeners.push(listener);
  return () => {
    popupState.listeners = popupState.listeners.filter(l => l !== listener);
  };
}

interface AiScribePopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onAction: (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => void;
  onClose: () => void;
  selectionInfo?: {
    textarea: HTMLTextAreaElement;
    start: number;
    end: number;
    restoreSelection: () => void;
  };
  className?: string;
}

// Shared hook for popup positioning
function usePopupPosition(popupRef: React.RefObject<HTMLDivElement>, position: { top: number; left: number }) {
  const [isPositionedAbove, setIsPositionedAbove] = useState(false);
  
  useEffect(() => {
    if (!popupRef.current) return;
    
    const updatePosition = () => {
      const rect = popupRef.current!.getBoundingClientRect();
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let top = position.top + 40; // Add 40px vertical offset to move popup lower
      let left = position.left;
      let positionedAbove = false;
      
      // Ensure minimum distance from left edge
      left = Math.max(20, left);
      
      // Adjust horizontal position if needed
      if (left + rect.width > viewportWidth - 20) {
        left = Math.max(20, viewportWidth - rect.width - 20);
      }
      
      // Adjust vertical position if needed
      if (top + rect.height > viewportHeight - 20) {
        // Position above the selection if not enough space below
        top = position.top - rect.height - 10;
        
        positionedAbove = true;
      }
      
      // Ensure minimum distance from top edge
      top = Math.max(10, top);
      
      setIsPositionedAbove(positionedAbove);
      
      // Apply position with fixed positioning to ensure it's relative to viewport
      if (popupRef.current) {
        popupRef.current.style.position = 'fixed';
        popupRef.current.style.top = `${top}px`;
        popupRef.current.style.left = `${left}px`;
        
        // Add transform with GPU acceleration for better performance
        popupRef.current.style.transform = positionedAbove ? 
          'translateY(-100%)' : 'none';
        popupRef.current.style.marginTop = positionedAbove ? 
          '-8px' : '8px';
      }
    };
    
    updatePosition();
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [position, popupRef]);
  
  return { isPositionedAbove };
}

// Shared hook for click outside handling
function useClickOutside(
  popupRef: React.RefObject<HTMLDivElement>, 
  onClose: () => void, 
  selectionInfo?: AiScribePopupProps['selectionInfo']
) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && 
          !popupRef.current.contains(e.target as Node) && 
          (!selectionInfo || e.target !== selectionInfo.textarea)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, selectionInfo, popupRef]);
}

export function AiScribePopup({ 
  selectedText, 
  position, 
  onAction, 
  onClose,
  selectionInfo,
  className
}: AiScribePopupProps) {
  const [mode, setMode] = useState<'compact' | 'expanded'>('compact');
  const [instructions, setInstructions] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Use shared hooks for positioning and click outside handling
  const { isPositionedAbove } = usePopupPosition(popupRef, position);
  useClickOutside(popupRef, onClose, selectionInfo);
  
  // Set the current popup type when this component mounts
  useEffect(() => {
    popupState.setPopupType('scribe');
    return () => {
      if (popupState.current === 'scribe') {
        popupState.setPopupType('none');
      }
    };
  }, []);
  
  const handleAction = (action: 'expand' | 'summarize' | 'rephrase' | 'revise') => {
    onAction(action, instructions);
  };
  
  return (
    <TooltipProvider>
      <div 
        ref={popupRef}
        className={`fixed shadow-lg rounded-lg bg-background border border-border p-2 w-[250px] z-[9999] ${className || ''}`}
        style={{ 
          position: 'fixed',
          top: 0, 
          left: 0,
          transform: `translate3d(0, 0, 0)` 
        }}
      >
        <div className="p-3">
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="secondary"
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
                  variant="secondary"
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
                  variant="secondary"
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
                  variant="secondary"
                  className="h-6 text-xs px-2 py-0 w-full flex items-center justify-center gap-1"
                  onClick={() => handleAction('revise')}
                >
                  <Edit className="h-3 w-3" />
                  <span>Revise</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fix and improve the text</p>
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

interface AiWritePopupProps {
  position: { top: number; left: number };
  onWrite: (instructions?: string) => void;
  onClose: () => void;
  className?: string;
}

export function AiWritePopup({ position, onWrite, onClose, className }: AiWritePopupProps) {
  const [instructions, setInstructions] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Use shared hooks for positioning and click outside handling
  const { isPositionedAbove } = usePopupPosition(popupRef, position);
  useClickOutside(popupRef, onClose);
  
  // Set the current popup type when this component mounts
  useEffect(() => {
    popupState.setPopupType('write');
    return () => {
      if (popupState.current === 'write') {
        popupState.setPopupType('none');
      }
    };
  }, []);
  
  const handleWrite = () => {
    // Call the onWrite prop with the instructions
    onWrite(instructions.trim() || undefined);
  };
  
  return (
      <div 
        ref={popupRef}
      className={`fixed shadow-lg rounded-lg bg-background border border-border p-2 w-[250px] z-[9999] write-popup ${className || ''}`}
        style={{ 
        position: 'fixed',
        top: 0, 
        left: 0,
        transform: isPositionedAbove ? 'translateY(-100%)' : 'none',
        marginTop: isPositionedAbove ? '-8px' : '8px'
        }}
      >
        <div className="p-3">
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 text-xs px-3 py-0 whitespace-nowrap flex items-center justify-center gap-1 w-full"
              onClick={handleWrite}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI Write</span>
            </Button>
            <Input 
              placeholder="Additional Instructions (optional)"
              className="text-xs h-7"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
      </div>
  );
}

// Shared hook for creating a text selection overlay
function useSelectionOverlay(
  showOverlay: boolean,
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  selectionRange: React.MutableRefObject<{start: number, end: number} | null>
) {
  useEffect(() => {
    if (!showOverlay || !textareaRef.current || !selectionRange.current) return;
    
    const textarea = textareaRef.current;
    const { start, end } = selectionRange.current;
    
    // Create a highlight element to overlay on the textarea
    const highlightOverlay = document.createElement('div');
    highlightOverlay.className = 'selection-highlight-overlay';
    highlightOverlay.style.position = 'absolute';
    highlightOverlay.style.pointerEvents = 'none'; // Don't interfere with textarea interaction
    highlightOverlay.style.zIndex = '1'; // Above textarea but below popup
    
    // Get textarea's styles and position
    const textareaRect = textarea.getBoundingClientRect();
    const textareaStyles = window.getComputedStyle(textarea);
    
    // Make the overlay match the textarea exactly
    highlightOverlay.style.top = `${textareaRect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${textareaRect.left + window.scrollX}px`;
    highlightOverlay.style.width = `${textareaRect.width}px`;
    highlightOverlay.style.height = `${textareaRect.height}px`;
    highlightOverlay.style.padding = textareaStyles.padding;
    highlightOverlay.style.border = 'none';
    highlightOverlay.style.overflow = 'hidden';
    
    // Create elements for the content
    const beforeContent = document.createElement('span');
    beforeContent.textContent = textarea.value.substring(0, start);
    beforeContent.style.whiteSpace = 'pre-wrap';
    
    const highlightedContent = document.createElement('span');
    highlightedContent.textContent = textarea.value.substring(start, end);
    highlightedContent.style.whiteSpace = 'pre-wrap';
    highlightedContent.style.backgroundColor = 'rgba(125, 125, 125, 0.3)'; // Grey semi-transparent
    highlightedContent.style.borderRadius = '2px';
    
    const afterContent = document.createElement('span');
    afterContent.textContent = textarea.value.substring(end);
    afterContent.style.whiteSpace = 'pre-wrap';
    
    // Append the parts to the overlay
    highlightOverlay.appendChild(beforeContent);
    highlightOverlay.appendChild(highlightedContent);
    highlightOverlay.appendChild(afterContent);
    
    // Style the overlay to match the textarea
    highlightOverlay.style.fontFamily = textareaStyles.fontFamily;
    highlightOverlay.style.fontSize = textareaStyles.fontSize;
    highlightOverlay.style.lineHeight = textareaStyles.lineHeight;
    highlightOverlay.style.color = 'transparent'; // Make text invisible
    highlightOverlay.style.backgroundColor = 'transparent';
    
    // Add overlay to the document
    document.body.appendChild(highlightOverlay);
    
    // Update the highlight position when textarea scrolls
    const handleScroll = () => {
      const updatedRect = textarea.getBoundingClientRect();
      highlightOverlay.style.top = `${updatedRect.top + window.scrollY}px`;
      highlightOverlay.style.left = `${updatedRect.left + window.scrollX}px`;
    };
    
    textarea.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Clean up
    return () => {
      document.body.removeChild(highlightOverlay);
      textarea.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showOverlay, textareaRef, selectionRange]);
}

export function useAiScribe(textareaRef: React.RefObject<HTMLTextAreaElement>, aiScribeEnabled: boolean) {
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  // Store selection range for persistence
  const selectionRange = useRef<{start: number, end: number} | null>(null);
  
  // Track if we're interacting with the popup
  const isInteractingWithPopup = useRef(false);
  
  // Track if popup was just closed by a document click
  const wasJustClosed = useRef(false);
  
  // Track last mousedown position to detect clicks on highlights
  const lastMouseDownPosition = useRef<{x: number, y: number} | null>(null);
  
  // Listen for popup state changes
  useEffect(() => {
    const unsubscribe = addPopupStateListener(() => {
      if (popupState.current === 'write') {
        setShowAiPopup(false);
      }
    });
    return unsubscribe;
  }, []);
  
  // Restore selection in the textarea
  const restoreSelection = () => {
    if (textareaRef.current && selectionRange.current) {
      const { start, end } = selectionRange.current;
      
      // We need to focus temporarily to set the selection range
      const activeElement = document.activeElement;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      
      // Return focus to the previous element if it wasn't the textarea
      if (activeElement instanceof HTMLElement && activeElement !== textareaRef.current) {
        activeElement.focus();
      }
    }
  };
  
  // Create a selection info object for the popup
  const getSelectionInfo = () => {
    if (textareaRef.current && selectionRange.current) {
      return {
        textarea: textareaRef.current,
        start: selectionRange.current.start,
        end: selectionRange.current.end,
        restoreSelection
      };
    }
    return undefined;
  };
  
  const handleTextSelection = (e?: MouseEvent) => {
    // Clear the "just closed" flag whenever a new text selection event happens
    wasJustClosed.current = false;
    
    if (!aiScribeEnabled) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Skip if we're currently interacting with the popup
    if (isInteractingWithPopup.current) return;
    
    // If mousedown and mouseup are at approximately the same position,
    // this is likely a click rather than a drag to select text.
    // In this case, we should not show the scribe popup.
    if (e && lastMouseDownPosition.current) {
      const mouseDownPos = lastMouseDownPosition.current;
      const dx = Math.abs(mouseDownPos.x - e.clientX);
      const dy = Math.abs(mouseDownPos.y - e.clientY);
      
      // If the mouse barely moved (within 5 pixels), treat as a click, not a selection
      if (dx < 5 && dy < 5) {
        selectionRange.current = null;
        // Reset the last mousedown position
        lastMouseDownPosition.current = null;
        return;
      }
    }
    
    // Reset the last mousedown position
    lastMouseDownPosition.current = null;
    
    // Delay the check slightly to ensure we're reading the final selection state after the mouseup
    setTimeout(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedTextValue = textarea.value.substring(start, end);
      
      if (selectedTextValue && selectedTextValue.trim().length > 0) {
        // Store the selection range for persistence
        selectionRange.current = { start, end };
        
        // Get position from mouse event if available, otherwise calculate from text
        let popupX = 0;
        let popupY = 0;
        
        if (e) {
          // Use the mouse event position with a small offset
          const OFFSET_X = 10; // pixels right of cursor
          const OFFSET_Y = 15; // pixels below cursor
          
          popupX = e.clientX + OFFSET_X + window.scrollX;
          popupY = e.clientY + OFFSET_Y + window.scrollY;
        } else {
          // Fallback to text-based calculation
        // Get the textarea's position and the selection coordinates
        const textareaRect = textarea.getBoundingClientRect();
        
        // Create a range to measure where the selection is
        const textBeforeSelection = textarea.value.substring(0, start);
        
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
            popupY = textareaRect.top + selectionRect.top - tempElement.getBoundingClientRect().top + selectionRect.height + window.scrollY;
            popupX = textareaRect.left + selectionRect.left - tempElement.getBoundingClientRect().left + window.scrollX;
          }
          
          // Clean up
          document.body.removeChild(tempElement);
        }
          
          setSelectedText(selectedTextValue);
          setPopupPosition({
          top: popupY,
          left: popupX
          });
        
          setShowAiPopup(true);
          // Update popup state to 'scribe' to close any other popups
          popupState.setPopupType('scribe');
      } else if (!isInteractingWithPopup.current) {
        selectionRange.current = null;
      }
    }, 10); // Small delay to ensure correct selection state
  };
  
  // Set up mouseup events for text selection
  useEffect(() => {
    if (aiScribeEnabled) {
      // Track mousedown to detect clicks on highlights
      const handleDocumentMouseDown = (e: MouseEvent) => {
        // Store the mousedown position to compare with mouseup
        lastMouseDownPosition.current = { x: e.clientX, y: e.clientY };
        
        const target = e.target as Node;
        const popupElement = document.querySelector('.scribe-popup');
        
        // If clicking outside the popup
        if (popupElement && !popupElement.contains(target)) {
          wasJustClosed.current = true;
          // Close popup on mousedown, not waiting for mouseup
          if (showAiPopup) {
            closePopup();
          }
        }
      };
      
      // Set up mouseup listener for text selection
      const handleMouseUp = (e: MouseEvent) => {
        // Pass the mouse event to handleTextSelection for position calculation
        handleTextSelection(e);
      };
      
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousedown', handleDocumentMouseDown);
    
    return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
    }
  }, [aiScribeEnabled, showAiPopup]);
  
  const handleAiAction = async (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => {
    // Log the action
    console.log(`AI ${action} for: ${selectedText}${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    if (textareaRef.current && selectionRange.current) {
      const { start, end } = selectionRange.current;
      const textarea = textareaRef.current;
      
      // Get the current value of the textarea
      const currentValue = textarea.value;
      
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
          fullDocument: currentValue
        });
        
        if (result.data.success) {
          // Extract the transformed text
          const transformedText = result.data.transformedText;
        
          // Replace the selected text with the transformed text
          const newValue = currentValue.substring(0, start) + 
                          transformedText + 
                          currentValue.substring(end);
          
          // Update the textarea value
          textarea.value = newValue;
          
          // Create and dispatch an input event to ensure onChange handlers are triggered
          const inputEvent = new Event('input', { bubbles: true });
          Object.defineProperty(inputEvent, 'target', {
            writable: false,
            value: { value: newValue }
          });
          textarea.dispatchEvent(inputEvent);
          
          // Move cursor to the end of the replaced text
          textarea.focus();
          const newCursorPosition = start + transformedText.length;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        } else {
          throw new Error('Failed to transform text');
        }
      } catch (error) {
        console.error('Error transforming text:', error);
        // Handle error - could show an error message to the user
      }
      
      // Close the popup after action
      closePopup();
    }
  };
  
  const closePopup = () => {
    setShowAiPopup(false);
    popupState.setPopupType('none');
    selectionRange.current = null;
    // Ensure we don't reopen immediately
    wasJustClosed.current = true;
  };
  
  return {
    showAiPopup,
    selectedText,
    popupPosition,
    handleAiAction,
    closePopup,
    selectionInfo: getSelectionInfo()
  };
}

export function useAiWrite(textareaRef: React.RefObject<HTMLTextAreaElement>, aiScribeEnabled: boolean) {
  const [showWritePopup, setShowWritePopup] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  
  // Listen for popup state changes
  useEffect(() => {
    const unsubscribe = addPopupStateListener(() => {
      if (popupState.current === 'scribe') {
        setShowWritePopup(false);
      }
    });
    return unsubscribe;
  }, []);
  
  // Calculate position at a given index in the textarea
  const getPositionAtIndex = (textarea: HTMLTextAreaElement, index: number) => {
    const textBeforeCursor = textarea.value.substring(0, index);
    
    // Create a temporary element to measure text dimensions
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'pre-wrap';
    tempElement.style.width = `${textarea.offsetWidth}px`;
    tempElement.style.fontSize = window.getComputedStyle(textarea).fontSize;
    tempElement.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    tempElement.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
    tempElement.style.padding = window.getComputedStyle(textarea).padding;
    
    // Add the text before cursor and a marker for the cursor
    tempElement.innerHTML = textBeforeCursor.replace(/\n/g, '<br>') + 
                          '<span id="cursor">|</span>';
    
    document.body.appendChild(tempElement);
    
    // Get the position of the cursor span
    const cursorSpan = tempElement.querySelector('#cursor');
    const textareaRect = textarea.getBoundingClientRect();
    let top = 0;
    let left = 0;
    
    if (cursorSpan) {
      const cursorRect = cursorSpan.getBoundingClientRect();
      top = textareaRect.top + cursorRect.top - tempElement.getBoundingClientRect().top;
      left = textareaRect.left + cursorRect.left - tempElement.getBoundingClientRect().left;
    }
    
    // Clean up
    document.body.removeChild(tempElement);
    
    return { 
      top: top + window.scrollY, 
      left: left + window.scrollX 
    };
  };
  
  // Handle cursor position clicks to show the AI write popup
  const handleCursorClick = (e: MouseEvent) => {
    if (!aiScribeEnabled) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Only show the popup on cursor clicks (when there's no selection)
    if (textarea.selectionStart === textarea.selectionEnd) {
      // Use a small delay to ensure any selection has been processed first
      setTimeout(() => {
        // Double check that we're still dealing with a cursor position
        if (textarea.selectionStart === textarea.selectionEnd) {
          // Define position - either from mouse event or calculated from text
          let popupX, popupY;
          
          if (e) {
            // Use the mouse event position with a small offset
            const OFFSET_X = 10; // pixels right of cursor
            const OFFSET_Y = 15; // pixels below cursor
            
            popupX = e.clientX + OFFSET_X + window.scrollX;
            popupY = e.clientY + OFFSET_Y + window.scrollY;
          } else {
            // Fallback to text-based calculation
            const position = getPositionAtIndex(textarea, textarea.selectionStart);
            popupX = position.left;
            popupY = position.top;
          }
          
          setCursorPosition({
            top: popupY,
            left: popupX
          });
          
    setShowWritePopup(true);
          // Update popup state to 'write' to close any other popups
    popupState.setPopupType('write');
        }
      }, 10);
    }
  };
  
  // Set up events for cursor clicks
  useEffect(() => {
    if (!aiScribeEnabled) return;
    
    // Create a document mousedown handler that closes the popup when clicking outside
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const popupElement = document.querySelector('.write-popup');
      
      // If clicking outside the popup
      if (popupElement && !popupElement.contains(target)) {
        // Close popup on mousedown, not waiting for mouseup
        if (showWritePopup) {
          closeWritePopup();
        }
      }
    };
    
    // Add click listener to detect cursor positions and show write popup
    const handleClick = (e: MouseEvent) => {
      // Only proceed if the target is the textarea
      if (e.target === textareaRef.current) {
        handleCursorClick(e);
      }
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('mousedown', handleDocumentMouseDown);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, [aiScribeEnabled, showWritePopup]);
  
  const handleWrite = async (instructions?: string) => {
    // Log the action
    console.log(`AI writing with instructions: ${instructions || 'none'}`);
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const currentValue = textarea.value;
      
      try {
        // Get Firebase functions instance
        const functions = getFunctions(getApp());
        
        // Create a callable reference to our Cloud Function
        const transformText = httpsCallable<AITransformationRequest, { success: boolean; transformedText: string }>(
          functions,
          'transformText'
        );
        
        // Call the Cloud Function - ensure text is never undefined
        const result = await transformText({
          text: instructions || '', // Use empty string if instructions is undefined
          action: 'expand', // Default action for writing new content
          additionalInstructions: instructions ? `Generate creative content based on: ${instructions}` : undefined
        });
        
        if (result.data.success) {
          // Extract the generated text
          const generatedText = result.data.transformedText;
          
          // Insert the generated text at the cursor position
          const newValue = currentValue.substring(0, cursorPos) + 
                           generatedText + 
                           currentValue.substring(cursorPos);
          
          // Update the textarea value
          textarea.value = newValue;
          
          // Update the cursor position and focus
          const newCursorPos = cursorPos + generatedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        } else {
          throw new Error('Failed to generate text');
        }
      } catch (error) {
        console.error('Error generating AI text:', error);
      }
      
      // Close the popup
      setShowWritePopup(false);
    }
  };
  
  const closeWritePopup = () => {
    setShowWritePopup(false);
    popupState.setPopupType('none');
  };
  
  return {
    showWritePopup,
    cursorPosition,
    handleWrite,
    closeWritePopup,
    setShowWritePopup,
    setCursorPosition
  };
}