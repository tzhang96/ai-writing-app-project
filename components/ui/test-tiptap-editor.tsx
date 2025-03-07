"use client";

import React, { useState } from "react";
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function TestTipTapEditor() {
  const [content, setContent] = useState('<p>Test editor - try typing here</p>');
  
  console.log('TestTipTapEditor rendering');
  
  // Initialize a minimal TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      console.log('Editor content updated:', editor.getText());
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'border border-gray-300 rounded p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500',
      },
    },
  });
  
  return (
    <div className="p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">Test Editor</h2>
      <p className="mb-2">This is a minimal test editor to diagnose issues with TipTap.</p>
      
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div>Loading editor...</div>
      )}
      
      <div className="mt-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            console.log('Focus button clicked');
            editor?.commands.focus();
          }}
        >
          Focus Editor
        </button>
      </div>
      
      <div className="mt-4 p-2 bg-gray-100 rounded">
        <h3 className="font-bold">Current HTML:</h3>
        <pre className="text-xs overflow-auto">{content}</pre>
      </div>
    </div>
  );
} 