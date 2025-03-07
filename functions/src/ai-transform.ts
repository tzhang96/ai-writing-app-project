import { onCall } from 'firebase-functions/v2/https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from "firebase-functions/params";

const geminiKey = defineSecret("GEMINI_KEY");

type AIAction = 'expand' | 'summarize' | 'rephrase' | 'revise';

interface AITransformationRequest {
  text: string;
  action: AIAction;
  additionalInstructions?: string;
  fullDocument?: string;
}

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

export const transformText = onCall({ secrets: [geminiKey] }, async (request) => {
  try {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new Error('You must be authenticated to use this feature.');
    }

    const data = request.data;
    
    // Validate input data
    if (!data.text || !data.action) {
      throw new Error('Text and action are required.');
    }

    // Initialize Gemini API with the secret key
    const apiKey = geminiKey.value().trim();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    // Generate the prompt and get the response
    const prompt = createPrompt(data);
    const result = await model.generateContent(prompt);
    const response = result.response;
    let responseText = response.text();

    // Clean up the response
    responseText = responseText
      .replace(/^Here is the .+?:\s*/i, '')
      .replace(/```[\s\S]*?```/g, match => match.replace(/```/g, '').trim())
      .trim();

    return { 
      success: true, 
      transformedText: responseText 
    };

  } catch (error) {
    console.error('Error in transformText function:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
}); 