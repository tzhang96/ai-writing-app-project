"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeService = exports.NAMESPACE_PREFIXES = void 0;
exports.createVectorStore = createVectorStore;
const pinecone_1 = require("@pinecone-database/pinecone");
const embeddings_1 = require("../ai/embeddings");
// Index name for our vectors
const INDEX_NAME = 'story-ai-index';
// Export namespace prefixes for use in other files
exports.NAMESPACE_PREFIXES = {
    CHAPTER: 'chapter',
    BEAT: 'beat',
    NOTE: 'note',
    CHARACTER: 'character',
    SETTING: 'setting',
    PLOT_POINT: 'plot_point',
    CUSTOM_FIELD: 'custom_field',
    CUSTOM_FIELD_VALUE: 'custom_field_value'
};
// Helper to create namespaced IDs
const createNamespacedId = (type, id) => {
    return `${exports.NAMESPACE_PREFIXES[type]}_${id}`;
};
// Helper to extract content for vectorization
const extractContentForVector = (content) => {
    if (typeof content === 'string')
        return content;
    if (content?.content)
        return content.content;
    if (content?.description)
        return content.description;
    return JSON.stringify(content);
};
class PineconeService {
    constructor(apiKey) {
        this.pinecone = new pinecone_1.Pinecone({
            apiKey
        });
        this.index = this.pinecone.index(INDEX_NAME);
        this.embeddings = (0, embeddings_1.createEmbeddings)(apiKey);
    }
    // Upsert a vector
    async upsertVector(type, id, content, metadata) {
        const vectorId = createNamespacedId(type, id);
        const textContent = extractContentForVector(content);
        // Get vector embedding from Gemini API
        const embedding = await this.getEmbedding(textContent);
        const vector = {
            id: vectorId,
            values: embedding,
            metadata: {
                ...metadata,
                type,
                id,
                originalContent: content,
                projectId: metadata.projectId
            }
        };
        // Store in Pinecone
        await this.index.upsert([vector]);
    }
    // Delete a vector
    async deleteVector(type, id) {
        const vectorId = createNamespacedId(type, id);
        await this.index.deleteOne(vectorId);
    }
    // Query similar vectors
    async querySimilar(text, filter, limit = 5) {
        const embedding = await this.getEmbedding(text);
        const results = await this.index.query({
            vector: embedding,
            filter,
            topK: limit,
            includeMetadata: true
        });
        return results.matches.map(match => match.metadata);
    }
    // Get embedding from Gemini API
    async getEmbedding(text) {
        return this.embeddings.generateEmbedding(text);
    }
    // Delete all vectors for a chapter
    async deleteChapterVectors(chapterId) {
        await this.index.deleteMany({
            filter: { chapterId }
        });
    }
}
exports.PineconeService = PineconeService;
// Export a function to create instances
function createVectorStore(apiKey) {
    return new PineconeService(apiKey);
}
//# sourceMappingURL=pinecone-client.js.map