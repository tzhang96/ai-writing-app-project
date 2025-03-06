"use client";

import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for our AI operations
export type AIAction = 'expand' | 'summarize' | 'rephrase' | 'revise';

// Define valid Gemini model types
export type GeminiModel = 
  | 'gemini-2.0-pro-exp-02-05'  // The Pro version
  | 'gemini-2.0-flash'         // The Flash version
  | 'gemini-2.0-flash-lite';  // The Flash Lite version

// Default model to use
export const DEFAULT_MODEL: GeminiModel = 'gemini-2.0-flash';

// Default word limit (can be overridden by environment variable)
export const DEFAULT_WORD_LIMIT = 2500;

// Get the word limit from environment variable or use default
export const getWordLimit = (): number => {
  const envLimit = process.env.NEXT_PUBLIC_WORD_LIMIT;
  return envLimit ? parseInt(envLimit, 10) : DEFAULT_WORD_LIMIT;
};

// Count words in text (more user-friendly than tokens)
export const countWords = (text: string): number => {
  // Remove HTML tags if present
  const textWithoutHtml = text.replace(/<[^>]*>/g, ' ');
  
  // Count words by splitting on whitespace
  const words = textWithoutHtml.trim().split(/\s+/);
  
  // Filter out empty strings that might result from multiple spaces
  return words.filter(word => word.length > 0).length;
};

interface AITransformationRequest {
  text: string;
  action: AIAction;
  additionalInstructions?: string;
  fullDocument?: string; // Optional full document content for context
}

// Initialize the Gemini API with the API key from environment variables
export const initializeGemini = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY is not defined in your environment variables');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Create the prompt for the Gemini API based on the action and additional instructions
const createPrompt = (request: AITransformationRequest): string => {
  const { text, action, additionalInstructions, fullDocument } = request;
  
  let prompt = 'IMPORTANT: Return ONLY the transformed text without any explanations, introductions, or commentary.\n\n';
  
  // If we have the full document, include it for context
  if (fullDocument) {
    prompt += `Below is the full document for context. You'll be asked to transform only a specific part of it:\n\n${fullDocument}\n\n`;
    prompt += `Now, please focus ONLY on transforming the following specific text (marked between triple backticks):\n\n\`\`\`\n${text}\n\`\`\`\n\n`;
  } else {
    // No full document provided, just use the selected text
    prompt += `Transform the following text:\n\n"${text}"\n\n`;
  }
  
  // Add action-specific instructions
  switch (action) {
    case 'expand':
      prompt += `Action: Expand this text with more details and context while maintaining consistency with the surrounding document.\n\n`;
      break;
    case 'summarize':
      prompt += `Action: Summarize this text concisely while preserving the key points.\n\n`;
      break;
    case 'rephrase':
      prompt += `Action: Rephrase this text while preserving its meaning. Use the surrounding document context to ensure consistent tone and terminology.\n\n`;
      break;
    case 'revise':
      prompt += `Action: Correct any factual errors, inconsistencies, or inaccuracies in this text. Maintain the original style and tone while fixing only the problematic content.\n\n`;
      break;
    default:
      prompt += `Action: Process this text appropriately.\n\n`;
  }
  
  if (additionalInstructions) {
    prompt += `Additional instructions/information: ${additionalInstructions}\n\n`;
  }
  
  prompt += 'Remember to return ONLY the transformed text with no explanations or additional text. Do not include phrases like "Here is the revised text:" or any other introductory or explanatory text.';
  
  return prompt;
};

// Perform AI transformation on the selected text
export const transformText = async (
  request: AITransformationRequest, 
  modelName: GeminiModel = DEFAULT_MODEL
): Promise<string> => {
  try {
    // Check word limits before proceeding
    const wordLimit = getWordLimit();
    const { text: selectedText, fullDocument } = request;
    
    // Count words for selected text and full document
    const selectedTextWords = countWords(selectedText);
    const fullDocumentWords = fullDocument ? countWords(fullDocument) : 0;
    
    console.log(`Estimated words - Selected: ${selectedTextWords}, Full document: ${fullDocumentWords}, Limit: ${wordLimit}`);
    
    // Check if we exceed the word limit
    if (fullDocumentWords > wordLimit) {
      throw new Error(`Document exceeds the word limit (${fullDocumentWords} > ${wordLimit}). Please reduce the document size.`);
    }
    
    const genAI = initializeGemini();
    // Use the provided model or fall back to the default
    const model = genAI.getGenerativeModel({ 
      model: modelName
    });
    
    console.log(`Using Gemini model: ${modelName}`);
    
    const prompt = createPrompt(request);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    let responseText = response.text();
    
    // Remove intro phrases but preserve internal quotes
    responseText = responseText.replace(/^Here is the .+?:\s*/i, '');
    
    // Remove triple backticks if present
    responseText = responseText.replace(/```[\s\S]*?```/g, match => match.replace(/```/g, '').trim());
    
    // Remove any leading or trailing whitespace including newlines
    responseText = responseText.trim();
    
    return responseText;
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error in Gemini API call');
  }
}; 