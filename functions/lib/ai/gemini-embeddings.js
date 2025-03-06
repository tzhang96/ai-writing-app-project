"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiEmbeddings = void 0;
exports.createEmbeddings = createEmbeddings;
const generative_ai_1 = require("@google/generative-ai");
class GeminiEmbeddings {
    constructor(apiKey) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async generateEmbedding(text) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Analyze this text and generate a numerical representation (embedding) that captures its semantic meaning. The embedding should be a JSON array of 1536 numbers between -1 and 1.

Text to analyze: "${text}"

Respond with ONLY the JSON array of numbers, no other text.`;
            const result = await model.generateContent(prompt);
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
//# sourceMappingURL=gemini-embeddings.js.map