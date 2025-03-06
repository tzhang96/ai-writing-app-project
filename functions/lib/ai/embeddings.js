"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiEmbeddings = void 0;
exports.createEmbeddings = createEmbeddings;
const generative_ai_1 = require("@google/generative-ai");
class GeminiEmbeddings {
    constructor(apiKey) {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
    async generateEmbedding(text) {
        try {
            // Since Gemini doesn't have a dedicated embeddings API yet,
            // we'll use a prompt to generate a consistent numerical representation
            const prompt = `Analyze this text and generate a numerical representation that captures its semantic meaning. 
      The representation should be consistent for similar content.
      Text: "${text}"
      
      Respond with ONLY a JSON array of 1536 numbers between -1 and 1, no other text.`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const embedding = JSON.parse(response.text());
            if (!Array.isArray(embedding) || embedding.length !== 1536) {
                throw new Error('Invalid embedding format');
            }
            return embedding;
        }
        catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }
}
exports.GeminiEmbeddings = GeminiEmbeddings;
function createEmbeddings(apiKey) {
    return new GeminiEmbeddings(apiKey);
}
//# sourceMappingURL=embeddings.js.map