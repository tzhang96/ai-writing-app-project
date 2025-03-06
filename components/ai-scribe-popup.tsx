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
  PenLine
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
        // Position above the cursor/selection instead of below
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
        // Add console log
        console.log('Click outside detected in useClickOutside', {
          hasRef: Boolean(popupRef.current),
          isTargetContained: popupRef.current?.contains(e.target as Node),
          hasSelectionInfo: Boolean(selectionInfo)
        });
        onClose();
      }
    };
    
    // Remove this handler as it's redundant with our editor's handlers
    // document.addEventListener('mousedown', handleClickOutside);
    // return () => {
    //   document.removeEventListener('mousedown', handleClickOutside);
    // };
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
  const [instructions, setInstructions] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Use shared positioning hook
  const { isPositionedAbove } = usePopupPosition(popupRef, position);
  
  // Use shared click outside hook
  useClickOutside(popupRef, onClose, selectionInfo);
  
  const handleAction = (action: 'expand' | 'summarize' | 'rephrase' | 'revise') => {
    onAction(action, instructions);
  };
  
  return (
    <TooltipProvider>
      <div 
        ref={popupRef}
        className={cn("fixed z-[100] shadow-lg rounded-lg bg-background border scribe-popup", className)}
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
          width: '250px',
          transform: isPositionedAbove ? 'translateY(-100%)' : 'none',
          marginTop: isPositionedAbove ? '-8px' : '8px',
        }}
        data-testid="ai-scribe-popup"
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
  
  // Use shared positioning hook
  const { isPositionedAbove } = usePopupPosition(popupRef, position);
  
  // Use shared click outside hook
  useClickOutside(popupRef, onClose);
  
  const handleWrite = () => {
    onWrite(instructions.trim() || undefined);
  };
  
  return (
    <div 
      ref={popupRef}
      className={cn("fixed z-[100] shadow-lg rounded-lg bg-background border p-3 write-popup", className)}
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        width: '250px',
        transform: isPositionedAbove ? 'translateY(-100%)' : 'none',
        marginTop: isPositionedAbove ? '-8px' : '8px',
      }}
      data-testid="ai-write-popup"
    >
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
  );
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
    console.log('handleTextSelection called', e ? { x: e.clientX, y: e.clientY } : 'no event');
    
    // Clear the "just closed" flag whenever a new text selection event happens
    wasJustClosed.current = false;
    
    if (!aiScribeEnabled) {
      console.log('AI Scribe not enabled');
      return;
    }
    
    const textarea = textareaRef.current;
    if (!textarea) {
      console.log('No textarea reference');
      return;
    }
    
    // Skip if we're currently interacting with the popup
    if (isInteractingWithPopup.current) {
      console.log('Currently interacting with popup');
      return;
    }
    
    // If mousedown and mouseup are at approximately the same position,
    // this is likely a click rather than a drag to select text.
    // In this case, we should not show the scribe popup.
    if (e && lastMouseDownPosition.current) {
      const mouseDownPos = lastMouseDownPosition.current;
      const dx = Math.abs(mouseDownPos.x - e.clientX);
      const dy = Math.abs(mouseDownPos.y - e.clientY);
      
      // If the mouse barely moved (within 5 pixels), treat as a click, not a selection
      if (dx < 5 && dy < 5) {
        console.log('Detected click on highlight, not showing scribe popup');
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
      
      console.log('Selection check:', { 
        start, 
        end, 
        text: selectedTextValue,
        hasText: Boolean(selectedTextValue && selectedTextValue.trim().length > 0)
      });
      
      if (selectedTextValue && selectedTextValue.trim().length > 0) {
        console.log('Text selected, showing popup');
        
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
          
          console.log('Using mouse position for popup:', { x: popupX, y: popupY });
        } else {
          // Fallback to text-based calculation
          console.log('No mouse event, using text-based calculation for popup position');
          
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
        
        console.log('Setting showAiPopup to true');
        setShowAiPopup(true);
        // Update popup state to 'scribe' to close any other popups
        popupState.setPopupType('scribe');
      } else if (!isInteractingWithPopup.current) {
        console.log('No text selected');
        selectionRange.current = null;
        // Don't close popup here - let document clicks handle this
      }
    }, 10); // Small delay to ensure correct selection state
  };
  
  // Set up mouseup events for text selection
  useEffect(() => {
    if (!aiScribeEnabled) return;
    
    console.log('Setting up mouseup event for AI Scribe');
    
    // Track mousedown to detect clicks on highlights
    const handleDocumentMouseDown = (e: MouseEvent) => {
      // Store the mousedown position to compare with mouseup
      lastMouseDownPosition.current = { x: e.clientX, y: e.clientY };
      
      const target = e.target as Node;
      const popupElement = document.querySelector('.scribe-popup');
      
      // If clicking outside the popup
      if (popupElement && !popupElement.contains(target)) {
        console.log('Document mousedown outside popup');
        wasJustClosed.current = true;
        // Close popup on mousedown, not waiting for mouseup
        if (showAiPopup) {
          closePopup();
        }
      }
    };
    
    // Set up mouseup listener on document for text selection
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
  }, [aiScribeEnabled, showAiPopup]);
  
  const handleAiAction = (action: 'expand' | 'summarize' | 'rephrase' | 'revise', instructions?: string) => {
    // Here we would integrate with the AI to process the selected text
    console.log(`AI ${action} for: ${selectedText}${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    // For now, we'll just close the popup
    setShowAiPopup(false);
    popupState.setPopupType('none');
    selectionRange.current = null;
  };
  
  const closePopup = () => {
    console.log('Closing AI popup');
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
    // Create a range to measure where the cursor is
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
    if (!aiScribeEnabled) {
      console.log('AI Write not enabled');
      return;
    }
    
    const textarea = textareaRef.current;
    if (!textarea) {
      console.log('No textarea reference for AI Write');
      return;
    }
    
    console.log('Cursor click detected', { x: e.clientX, y: e.clientY });
    
    // Only show the popup on cursor clicks (when there's no selection)
    if (textarea.selectionStart === textarea.selectionEnd) {
      // Use a small delay to ensure any selection has been processed first
      setTimeout(() => {
        // Double check that we're still dealing with a cursor position
        if (textarea.selectionStart === textarea.selectionEnd) {
          console.log('Showing write popup at cursor position');
          
          // Define position - either from mouse event or calculated from text
          let popupX, popupY;
          
          if (e) {
            // Use the mouse event position with a small offset
            const OFFSET_X = 10; // pixels right of cursor
            const OFFSET_Y = 15; // pixels below cursor
            
            popupX = e.clientX + OFFSET_X + window.scrollX;
            popupY = e.clientY + OFFSET_Y + window.scrollY;
            
            console.log('Using mouse position for write popup:', { x: popupX, y: popupY });
          } else {
            // Fallback to text-based calculation
            const position = getPositionAtIndex(textarea, textarea.selectionStart);
            popupX = position.left;
            popupY = position.top;
            console.log('Using calculated position for write popup:', position);
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
    
    console.log('Setting up events for AI Write popup');
    
    // Create a document mousedown handler that closes the popup when clicking outside
    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const popupElement = document.querySelector('.write-popup');
      
      // If clicking outside the popup
      if (popupElement && !popupElement.contains(target)) {
        console.log('Document mousedown outside write popup');
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
  
  const handleWrite = (instructions?: string) => {
    // Here we would integrate with the AI to generate content
    console.log(`AI writing with instructions: ${instructions || 'none'}`);
    
    // For now, we'll just close the popup
    setShowWritePopup(false);
    popupState.setPopupType('none');
  };
  
  const closeWritePopup = () => {
    console.log('Closing write popup');
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