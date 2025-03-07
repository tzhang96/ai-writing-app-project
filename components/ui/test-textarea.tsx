"use client";

import React, { useState, useEffect } from "react";

export function TestTextarea() {
  const [text, setText] = useState("Test textarea - try typing here");
  const [keyPresses, setKeyPresses] = useState<string[]>([]);
  
  useEffect(() => {
    console.log('TestTextarea component mounted');
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      console.log('Global keydown:', e.key);
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Textarea changed:', e.target.value);
    setText(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('Textarea keydown:', e.key);
    setKeyPresses(prev => [...prev.slice(-4), e.key]);
  };
  
  return (
    <div className="p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">Test Textarea</h2>
      <p className="mb-2">This is a simple textarea to test if basic input works.</p>
      
      <textarea
        className="w-full border border-gray-300 rounded p-4 min-h-[200px]"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={() => console.log('Textarea clicked')}
        onFocus={() => console.log('Textarea focused')}
        onBlur={() => console.log('Textarea blurred')}
      />
      
      <div className="mt-4 p-2 bg-gray-100 rounded">
        <h3 className="font-bold">Last 5 key presses:</h3>
        <div className="flex gap-2 mt-2">
          {keyPresses.map((key, i) => (
            <span key={i} className="px-2 py-1 bg-blue-100 rounded">{key}</span>
          ))}
        </div>
      </div>
    </div>
  );
} 