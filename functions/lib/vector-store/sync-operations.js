"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVectorStore = initVectorStore;
exports.syncChapterContent = syncChapterContent;
exports.syncChapterBeat = syncChapterBeat;
exports.syncChapterNote = syncChapterNote;
exports.syncEntity = syncEntity;
exports.deleteChapterContent = deleteChapterContent;
exports.deleteEntitySync = deleteEntitySync;
exports.deleteBeatSync = deleteBeatSync;
exports.deleteNoteSync = deleteNoteSync;
const gemini_embeddings_1 = require("../ai/gemini-embeddings");
const pinecone_client_1 = require("./pinecone-client");
// Create a function to initialize vector store with API key
function initVectorStore(apiKey) {
    const vectorStore = (0, pinecone_client_1.createVectorStore)(apiKey);
    const embeddings = (0, gemini_embeddings_1.createEmbeddings)(apiKey);
    vectorStore['getEmbedding'] = embeddings.generateEmbedding.bind(embeddings);
    return vectorStore;
}
// All sync operations now take vectorStore as a parameter
async function syncChapterContent(vectorStore, chapter) {
    await vectorStore.upsertVector('CHAPTER', chapter.id, chapter.content || '', {
        chapterId: chapter.id,
        projectId: chapter.projectId,
        title: chapter.title
    });
}
async function syncChapterBeat(vectorStore, beat) {
    await vectorStore.upsertVector('BEAT', beat.id, beat.content, {
        chapterId: beat.chapterId,
        projectId: beat.projectId,
        title: beat.title
    });
}
async function syncChapterNote(vectorStore, note) {
    await vectorStore.upsertVector('NOTE', note.id, note.content, {
        chapterId: note.chapterId,
        projectId: note.projectId,
        title: note.title
    });
}
async function syncEntity(vectorStore, entity, chapterId) {
    const type = entity.type === 'character' ? 'CHARACTER' :
        entity.type === 'setting' ? 'SETTING' : 'PLOT_POINT';
    await vectorStore.upsertVector(type, entity.id, {
        name: entity.name,
        ...entity.metadata
    }, {
        chapterId,
        projectId: entity.projectId,
        title: entity.name
    });
}
async function deleteChapterContent(vectorStore, chapterId) {
    await vectorStore.deleteChapterVectors(chapterId);
}
async function deleteEntitySync(vectorStore, entityId, type) {
    const vectorType = type === 'character' ? 'CHARACTER' :
        type === 'setting' ? 'SETTING' : 'PLOT_POINT';
    await vectorStore.deleteVector(vectorType, entityId);
}
async function deleteBeatSync(vectorStore, beatId) {
    await vectorStore.deleteVector('BEAT', beatId);
}
async function deleteNoteSync(vectorStore, noteId) {
    await vectorStore.deleteVector('NOTE', noteId);
}
//# sourceMappingURL=sync-operations.js.map