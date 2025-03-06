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
}

// Shared hook for popup positioning
function usePopupPosition(popupRef: React.RefObject<HTMLDivElement>, position: { top: number; left: number }) {
  const [isPositionedAbove, setIsPositionedAbove] = useState(false);
  
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
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
        // Position above the cursor/selection instead of below
        top = Math.max(10, position.top - rect.height - 10); // Reduced offset when positioned above
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
        popupRef.current.style.zIndex = '9999'; // Ensure it's above other elements
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
  selectionInfo 
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
        className="fixed shadow-lg rounded-lg bg-background border border-border p-2 w-[280px] z-[9999]"
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
}

export function AiWritePopup({ position, onWrite, onClose }: AiWritePopupProps) {
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
    onWrite(instructions);
  };
  
  return (
    <TooltipProvider>
      <div 
        ref={popupRef} 
        className="fixed shadow-lg rounded-lg bg-background border border-border p-2 w-[280px] z-[9999]"
        style={{ 
          position: 'fixed',
          top: 0, 
          left: 0,
          transform: `translate3d(0, 0, 0)` 
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
    </TooltipProvider>
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
  
  // Listen for popup state changes
  useEffect(() => {
    const unsubscribe = addPopupStateListener(() => {
      if (popupState.current === 'write') {
        setShowAiPopup(false);
      }
    });
    return unsubscribe;
  }, []);
  
  // Use shared selection overlay hook
  useSelectionOverlay(showAiPopup, textareaRef, selectionRange);
  
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
  
  const handleTextSelection = () => {
    if (!aiScribeEnabled) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Skip if we're currently interacting with the popup
    if (isInteractingWithPopup.current) return;
    
    // Delay the check slightly to ensure we're reading the final selection state after the mouseup
    setTimeout(() => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedTextValue = textarea.value.substring(start, end);
      
      if (selectedTextValue && selectedTextValue.trim().length > 0) {
        // Store the selection range for persistence
        selectionRange.current = { start, end };
        
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
          const top = textareaRect.top + selectionRect.top - tempElement.getBoundingClientRect().top + selectionRect.height;
          const left = textareaRect.left + selectionRect.left - tempElement.getBoundingClientRect().left;
          
          setSelectedText(selectedTextValue);
          setPopupPosition({
            top: top + window.scrollY,
            left: left + window.scrollX
          });
          setShowAiPopup(true);
          // Update popup state to 'scribe' to close any other popups
          popupState.setPopupType('scribe');
        }
        
        // Clean up
        document.body.removeChild(tempElement);
      } else if (!isInteractingWithPopup.current) {
        selectionRange.current = null;
        setShowAiPopup(false);
      }
    }, 10); // Small delay to ensure correct selection state
  };
  
  // Set up mouseup events for text selection
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
    popupState.setPopupType('none');
    selectionRange.current = null;
  };
  
  const closePopup = () => {
    setShowAiPopup(false);
    popupState.setPopupType('none');
    selectionRange.current = null;
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
  const cursorIndex = useRef<number | null>(null);
  
  // Track if the popup is already shown to prevent duplicates
  const isPopupVisible = useRef(false);
  
  // Listen for popup state changes
  useEffect(() => {
    const unsubscribe = addPopupStateListener(() => {
      if (popupState.current === 'scribe') {
        setShowWritePopup(false);
        isPopupVisible.current = false;
      }
    });
    return unsubscribe;
  }, []);
  
  const getPositionAtIndex = (textarea: HTMLTextAreaElement, index: number) => {
    const textBeforeCursor = textarea.value.substring(0, index);
    
    // Create a temporary element to measure text dimensions
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.whiteSpace = 'pre-wrap';
    tempElement.style.width = `${textarea.clientWidth}px`;
    tempElement.style.fontSize = window.getComputedStyle(textarea).fontSize;
    tempElement.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    tempElement.style.fontFamily = window.getComputedStyle(textarea).fontFamily;
    tempElement.style.padding = window.getComputedStyle(textarea).padding;
    
    // Add a marker at the cursor position
    tempElement.innerHTML = textBeforeCursor.replace(/\n/g, '<br>') + '<span id="cursor">|</span>';
    
    document.body.appendChild(tempElement);
    
    // Get the position of the marker
    const cursorSpan = tempElement.querySelector('#cursor');
    let top = 0;
    let left = 0;
    
    if (cursorSpan) {
      const cursorRect = cursorSpan.getBoundingClientRect();
      const textareaRect = textarea.getBoundingClientRect();
      
      // Calculate position relative to the textarea
      top = cursorRect.top - tempElement.getBoundingClientRect().top + textareaRect.top;
      left = cursorRect.left - tempElement.getBoundingClientRect().left + textareaRect.left;
    }
    
    // Clean up
    document.body.removeChild(tempElement);
    
    return { 
      top: top + window.scrollY, 
      left: left + window.scrollX 
    };
  };
  
  const handleCursorClick = (e: MouseEvent) => {
    if (!aiScribeEnabled) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Only proceed if the click is directly on the textarea
    if (e.target !== textarea) return;
    
    // If popup is already visible, don't show another one
    if (isPopupVisible.current) return;
    
    // Only show the popup if no text is selected
    if (textarea.selectionStart !== textarea.selectionEnd) {
      return;
    }
    
    // Store the cursor position for later use
    cursorIndex.current = textarea.selectionStart;
    
    // Get the position directly at the cursor within the text
    const position = getPositionAtIndex(textarea, textarea.selectionStart);
    
    setCursorPosition(position);
    setShowWritePopup(true);
    isPopupVisible.current = true;
    popupState.setPopupType('write');
  };
  
  useEffect(() => {
    if (aiScribeEnabled) {
      document.addEventListener('click', handleCursorClick);
    }
    
    return () => {
      document.removeEventListener('click', handleCursorClick);
    };
  }, [aiScribeEnabled]);
  
  // When the popup is closed, update the isPopupVisible flag
  useEffect(() => {
    if (!showWritePopup) {
      isPopupVisible.current = false;
    }
  }, [showWritePopup]);
  
  const handleWrite = (instructions?: string) => {
    // Here we would integrate with the AI to generate content
    console.log(`AI Write at cursor position ${instructions ? ` with instructions: ${instructions}` : ''}`);
    
    // For now, we'll just close the popup
    setShowWritePopup(false);
    isPopupVisible.current = false;
    popupState.setPopupType('none');
  };
  
  const closeWritePopup = () => {
    setShowWritePopup(false);
    isPopupVisible.current = false;
    popupState.setPopupType('none');
  };
  
  return {
    showWritePopup,
    cursorPosition,
    handleWrite,
    closeWritePopup
  };
}