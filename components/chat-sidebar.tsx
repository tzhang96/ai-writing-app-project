"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat, Message } from '@/lib/chat-context';

interface ChatSidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

// Number of previous messages to include for context
const CONTEXT_WINDOW = 10;

// Loading dots animation component
function LoadingDots() {
  return (
    <div className="flex space-x-1 items-center h-4">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  );
}

export function ChatSidebar({ className = "", isCollapsed = false }: ChatSidebarProps) {
  const { messages, setMessages, isLoading, setIsLoading } = useChat();
  const [inputValue, setInputValue] = useState('');

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      // Convert string timestamps back to Date objects
      const messagesWithDates = parsedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(messagesWithDates);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    // Get all previous messages plus the new one
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get recent messages for context (excluding the new message)
      const recentMessages = messages.slice(-CONTEXT_WINDOW);
      
      // Format history for Gemini chat
      const history = recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Debug log the conversation history
      console.log('Sending conversation history:', {
        previousMessages: history,
        currentMessage: inputValue
      });

      // Call the Firebase function with history
      const chatFunction = httpsCallable(functions, 'chat');
      const result = await chatFunction({ 
        message: inputValue,
        history // Send all previous messages as history
      });
      const response = result.data as { text: string; timestamp: string };

      console.log('Received response:', response);

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
      };
      setMessages((prevMessages: Message[]) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages: Message[]) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCollapsed) return null;

  return (
    <div className={`h-full flex flex-col border-l min-w-[320px] ${className}`}>
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="font-semibold">AI Assistant</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            localStorage.removeItem('chatMessages');
            setMessages([{
              id: '1',
              text: 'Hello! I\'m your AI writing assistant. How can I help with your project today?',
              sender: 'ai',
              timestamp: new Date(),
            }]);
          }}
        >
          Clear Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.sender === 'user' ? (
                  <p className="break-words">{message.text}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg p-3 bg-muted">
                <LoadingDots />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask your AI assistant..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="shrink-0" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 