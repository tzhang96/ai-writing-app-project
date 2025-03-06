"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformText = exports.generateAIContent = exports.chat = exports.clearDatabase = exports.processNote = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const geminiKey = (0, params_1.defineSecret)("GEMINI_KEY");
// Initial categorization and processing
exports.processNote = (0, https_1.onCall)({ secrets: [geminiKey] }, async (request) => {
    const content = request.data.content;
    console.log('processNote started with content length:', content?.length);
    if (!content || typeof content !== 'string') {
        console.error('Invalid content:', content);
        throw new Error('Invalid content provided');
    }
    try {
        const apiKey = geminiKey.value().trim();
        if (!apiKey) {
            console.error('Gemini API key missing');
            throw new Error('Gemini API key is not configured');
        }
        console.log('Initializing Gemini AI...');
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        console.log('Sending initial prompt to Gemini...');
        const initialPrompt = `You are a JSON-only response API. Analyze this note and identify relevant sections for processing.
    Note content: "${content}"

    Respond with only valid JSON matching this structure:
    {
      "category": "category_name",
      "confidence": 0.95,
      "tags": ["tag1", "tag2"],
      "sectionsToProcess": {
        "characters": [
          {
            "relevantText": "text about character",
            "characterName": "name",
            "confidence": 0.9
          }
        ],
        "locations": [
          {
            "relevantText": "text about location",
            "locationName": "name",
            "confidence": 0.9
          }
        ],
        "events": [
          {
            "relevantText": "text about event",
            "eventName": "name",
            "confidence": 0.9
          }
        ]
      }
    }`;
        const result = await model.generateContent(initialPrompt);
        const response = await result.response;
        const responseText = response.text();
        console.log('Received raw response from Gemini:', responseText);
        // Clean up the response text
        const cleanJson = responseText
            .replace(/^```json\n/, '')
            .replace(/\n```$/, '')
            .trim();
        console.log('Cleaned JSON:', cleanJson);
        const initialProcessing = JSON.parse(cleanJson);
        console.log('Parsed initial processing result:', initialProcessing);
        // Filter sections based on confidence threshold
        const CONFIDENCE_THRESHOLD = 0.8;
        const sectionsToProcess = {
            characters: initialProcessing.sectionsToProcess.characters?.filter((c) => c.confidence >= CONFIDENCE_THRESHOLD) || [],
            locations: initialProcessing.sectionsToProcess.locations?.filter((l) => l.confidence >= CONFIDENCE_THRESHOLD) || [],
            events: initialProcessing.sectionsToProcess.events?.filter((e) => e.confidence >= CONFIDENCE_THRESHOLD) || []
        };
        // Process each entity type if needed
        const extractedEntities = {
            characters: [],
            locations: [],
            events: []
        };
        // Process characters first to have their names available
        if (sectionsToProcess.characters.length > 0) {
            console.log('Processing characters...');
            const characterPrompt = `Analyze these character sections and extract detailed information. Be thorough in extracting all attributes and relationships, even if they are implied or the character is unnamed.

      Important extraction rules:
      1. For unnamed characters, use their relationship or role as their name (e.g., "Sarah's younger brother")
      2. Extract ALL personality traits mentioned (e.g., brave, resourceful)
      3. Extract ALL physical attributes (e.g., hair color, eye color)
      4. Extract ALL background information (e.g., hometown, upbringing)
      5. Create relationships for any mentioned connections between characters

      Sections to analyze: ${JSON.stringify(sectionsToProcess.characters)}
      
      Respond with only valid JSON in this format:
      {
        "characters": [
          {
            "name": "string (use role/relationship if unnamed)",
            "aliases": ["string (other ways the character is referenced)"],
            "attributes": {
              "personality": ["string (all personality traits)"],
              "appearance": ["string (all physical attributes)"],
              "background": ["string (all background details)"]
            },
            "relationships": [
              {
                "targetName": "string (name or role of related character)",
                "type": "string (e.g., sibling, friend, antagonist)",
                "description": "string (detailed relationship description)"
              }
            ]
          }
        ]
      }`;
            const characterResult = await model.generateContent(characterPrompt);
            const characterResponse = await characterResult.response;
            const characterJson = JSON.parse(characterResponse.text()
                .replace(/^```json\n/, '')
                .replace(/\n```$/, '')
                .trim());
            extractedEntities.characters = characterJson.characters;
        }
        // Get all character names for reference in other entities
        const characterNames = extractedEntities.characters.map((char) => ({
            name: char.name,
            aliases: char.aliases || []
        }));
        // Process locations with character context
        if (sectionsToProcess.locations.length > 0) {
            console.log('Processing locations...');
            const locationPrompt = `Analyze these location sections and extract detailed information. Be thorough in extracting all attributes and significance.
      
      Known characters in the story: ${JSON.stringify(characterNames)}

      Important extraction rules:
      1. Extract the full description of the location
      2. Note any historical or cultural significance
      3. Identify any notable features or characteristics
      4. Use SPECIFIC character names when mentioning characters (e.g., "Sarah grew up here" instead of "the character grew up here")
      5. Note any events that occurred here, using specific character names

      Sections to analyze: ${JSON.stringify(sectionsToProcess.locations)}
      
      Respond with only valid JSON in this format:
      {
        "locations": [
          {
            "name": "string",
            "description": "string (detailed description using specific character names)",
            "attributes": {
              "type": "string (e.g., town, building, region)",
              "features": ["string (notable characteristics)"],
              "significance": ["string (historical/cultural importance, using specific character names)"],
              "associatedCharacters": ["string (exact names of characters connected to this location)"]
            },
            "characterConnections": [
              {
                "characterName": "string (exact character name)",
                "connection": "string (how this character is connected to the location)"
              }
            ]
          }
        ]
      }`;
            const locationResult = await model.generateContent(locationPrompt);
            const locationResponse = await locationResult.response;
            const locationJson = JSON.parse(locationResponse.text()
                .replace(/^```json\n/, '')
                .replace(/\n```$/, '')
                .trim());
            extractedEntities.locations = locationJson.locations;
        }
        // Process events with character context
        if (sectionsToProcess.events.length > 0) {
            console.log('Processing events...');
            const eventPrompt = `Analyze these event sections and extract detailed information. Be thorough in extracting all details and connections.
      
      Known characters in the story: ${JSON.stringify(characterNames)}

      Important extraction rules:
      1. Extract the full description of the event using specific character names
      2. Use EXACT character names for all involved characters (e.g., "Sarah" and "Sarah's younger brother")
      3. Note all locations where the event occurs
      4. Track any temporal information (when it happens)
      5. Note the significance or impact of the event, using specific character names

      Sections to analyze: ${JSON.stringify(sectionsToProcess.events)}
      
      Respond with only valid JSON in this format:
      {
        "events": [
          {
            "name": "string (descriptive name of the event, including character names)",
            "description": "string (detailed description using specific character names)",
            "involvedCharacters": [
              {
                "name": "string (exact character name)",
                "role": "string (their role in the event)"
              }
            ],
            "locations": ["string (all involved locations)"],
            "timing": {
              "period": "string (when it occurs)",
              "duration": "string (how long it lasts)"
            },
            "significance": "string (impact or importance of the event, using specific character names)"
          }
        ]
      }`;
            const eventResult = await model.generateContent(eventPrompt);
            const eventResponse = await eventResult.response;
            const eventJson = JSON.parse(eventResponse.text()
                .replace(/^```json\n/, '')
                .replace(/\n```$/, '')
                .trim());
            extractedEntities.events = eventJson.events;
        }
        // Initialize relationships from extracted entities
        const relationships = {
            characters: extractedEntities.characters.map((c) => c.name),
            locations: extractedEntities.locations.map((l) => l.name),
            events: extractedEntities.events.map((e) => e.name)
        };
        const finalResponse = {
            category: initialProcessing.category,
            confidence: initialProcessing.confidence,
            tags: initialProcessing.tags,
            relationships,
            extractedEntities
        };
        console.log('Final response with extracted entities:', finalResponse);
        const batch = db.batch();
        const noteRef = db.collection('notes').doc();
        const noteId = noteRef.id;
        // Store characters with enhanced attributes
        for (const char of extractedEntities.characters) {
            const charRef = db.collection('characters').doc();
            batch.set(charRef, {
                id: charRef.id,
                name: char.name,
                aliases: char.aliases || [],
                attributes: {
                    personality: char.attributes?.personality || [],
                    appearance: char.attributes?.appearance || [],
                    background: char.attributes?.background || []
                },
                relationships: char.relationships || [],
                noteReferences: [noteId]
            });
        }
        // Store locations with enhanced attributes and character connections
        for (const loc of extractedEntities.locations) {
            const locRef = db.collection('locations').doc();
            batch.set(locRef, {
                id: locRef.id,
                name: loc.name,
                description: loc.description || '',
                attributes: {
                    type: loc.attributes?.type || '',
                    features: loc.attributes?.features || [],
                    significance: loc.attributes?.significance || [],
                    associatedCharacters: loc.attributes?.associatedCharacters || []
                },
                characterConnections: loc.characterConnections || [],
                noteReferences: [noteId]
            });
        }
        // Store events with enhanced character involvement
        for (const event of extractedEntities.events) {
            const eventRef = db.collection('events').doc();
            batch.set(eventRef, {
                id: eventRef.id,
                name: event.name,
                description: event.description || '',
                involvedCharacters: event.involvedCharacters || [],
                locations: event.locations || [],
                timing: event.timing || {},
                significance: event.significance || '',
                noteReferences: [noteId]
            });
        }
        // Store the note with references
        batch.set(noteRef, {
            id: noteId,
            content,
            category: initialProcessing.category,
            tags: initialProcessing.tags,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date()
            },
            entities: {
                characters: extractedEntities.characters.map((c) => c.name),
                locations: extractedEntities.locations.map((l) => l.name),
                events: extractedEntities.events.map((e) => e.name)
            }
        });
        await batch.commit();
        console.log('All entities stored successfully');
        return finalResponse;
    }
    catch (error) {
        console.error('Error in note processing:', error);
        throw error;
    }
});
// Add new clearDatabase function
exports.clearDatabase = (0, https_1.onCall)(async (request) => {
    try {
        console.log('Starting database clear operation...');
        const batch = db.batch();
        const collections = ['notes', 'characters', 'locations', 'events'];
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
        }
        await batch.commit();
        console.log('Database cleared successfully');
        return { success: true, message: 'Database cleared successfully' };
    }
    catch (error) {
        console.error('Error clearing database:', error);
        throw error;
    }
});
// Chat function
exports.chat = (0, https_1.onCall)({ secrets: [geminiKey] }, async (request) => {
    const { message, history } = request.data;
    if (!message || typeof message !== 'string') {
        throw new Error('Invalid message provided');
    }
    try {
        const apiKey = geminiKey.value().trim();
        if (!apiKey) {
            throw new Error('Gemini API key is not configured');
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        // Format conversation history into a clear context
        const historyText = history.length > 0
            ? "Here is our conversation history so far. Please maintain context from this history when responding:\n\n" +
                history.map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`).join('\n\n')
            : "";
        const fullPrompt = `${historyText}

${historyText ? 'Current message:' : ''}
Human: ${message}

You are an AI writing assistant. Please provide a helpful response while maintaining context from our conversation history above. Be consistent with any previous information or decisions discussed. If the user refers to something mentioned earlier in the conversation, use that context in your response.`;
        console.log('Full prompt being sent to Gemini:', fullPrompt);
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return {
            text: response.text(),
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error in chat:', error);
        throw new Error(error instanceof Error ? error.message : 'Unknown error in chat');
    }
});
// AI content generation for notes, beats, and text
exports.generateAIContent = (0, https_1.onCall)({ secrets: [geminiKey] }, async (request) => {
    const { type, chapterId, currentContent, projectId } = request.data;
    if (!chapterId || !projectId) {
        throw new Error('Missing required parameters');
    }
    try {
        const apiKey = geminiKey.value().trim();
        if (!apiKey) {
            throw new Error('Gemini API key is not configured');
        }
        // Get chapter data from Firestore
        const chapterDoc = await db.collection('chapters').doc(chapterId).get();
        if (!chapterDoc.exists) {
            throw new Error('Chapter not found');
        }
        const chapter = chapterDoc.data();
        // Get entity connections for this chapter
        const connectionsRef = db.collection('chapterEntityConnections');
        const connectionsQuery = connectionsRef.where('chapterId', '==', chapterId);
        const connectionsSnapshot = await connectionsQuery.get();
        // Group connections by type
        const connectionsByType = {
            character: [],
            setting: [],
            plotPoint: [],
        };
        connectionsSnapshot.docs.forEach(doc => {
            const connection = doc.data();
            if (connection.entityType in connectionsByType) {
                connectionsByType[connection.entityType].push(connection.entityId);
            }
        });
        // Fetch entities for each type
        const connections = {
            characters: [],
            settings: [],
            plotPoints: [],
        };
        // Fetch characters
        if (connectionsByType.character.length > 0) {
            const characterDocs = await Promise.all(connectionsByType.character.map(id => db.collection('characters').doc(id).get()));
            connections.characters = characterDocs
                .filter(doc => doc.exists)
                .map(doc => {
                const data = doc.data();
                return {
                    name: data?.name || 'Unnamed Character',
                    description: data?.description,
                    attributes: {
                        personality: Array.isArray(data?.attributes?.personality) ? data.attributes.personality : [],
                        appearance: Array.isArray(data?.attributes?.appearance) ? data.attributes.appearance : [],
                        background: Array.isArray(data?.attributes?.background) ? data.attributes.background : []
                    },
                    relationships: Array.isArray(data?.relationships) ? data.relationships.map(r => ({
                        targetName: r.targetName || 'Unknown',
                        type: r.type || 'Unknown',
                        description: r.description || 'No description'
                    })) : []
                };
            });
        }
        // Fetch settings
        if (connectionsByType.setting.length > 0) {
            const settingDocs = await Promise.all(connectionsByType.setting.map(id => db.collection('locations').doc(id).get()));
            connections.settings = settingDocs
                .filter(doc => doc.exists)
                .map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    description: data.description,
                    attributes: {
                        type: data.attributes?.type,
                        features: data.attributes?.features || [],
                        significance: data.attributes?.significance || []
                    }
                };
            });
        }
        // Fetch plot points
        if (connectionsByType.plotPoint.length > 0) {
            const plotPointDocs = await Promise.all(connectionsByType.plotPoint.map(id => db.collection('events').doc(id).get()));
            connections.plotPoints = plotPointDocs
                .filter(doc => doc.exists)
                .map(doc => {
                const data = doc.data();
                return {
                    name: data.name,
                    description: data.description,
                    attributes: {
                        events: data.attributes?.events || [],
                        impact: data.attributes?.impact || [],
                        connections: data.attributes?.connections || []
                    }
                };
            });
        }
        // Get chapter beats and notes
        const [beatsSnapshot, notesSnapshot] = await Promise.all([
            db.collection('chapterBeats')
                .where('chapterId', '==', chapterId)
                .orderBy('order')
                .get(),
            db.collection('chapterNotes')
                .where('chapterId', '==', chapterId)
                .get()
        ]);
        const beats = beatsSnapshot.docs.map(doc => doc.data());
        const notes = notesSnapshot.docs.map(doc => doc.data());
        // Create context string from metadata
        const contextString = `
Chapter Title: ${chapter?.title || 'Untitled'}
Current Chapter Text: ${chapter?.content || ''}

Connected Characters:
${connections.characters.map(char => `
- ${char.name}
  Description: ${char.description || 'No description'}
  Personality: ${char.attributes?.personality?.join(', ') || 'None specified'}
  Appearance: ${char.attributes?.appearance?.join(', ') || 'None specified'}
  Background: ${char.attributes?.background?.join(', ') || 'None specified'}
  Relationships: ${Array.isArray(char.relationships) && char.relationships.length > 0
            ? char.relationships.map(r => `${r.targetName || 'Unknown'} (${r.type || 'Unknown'}): ${r.description || 'No description'}`).join(', ')
            : 'None specified'}
`).join('\n')}

Connected Settings:
${connections.settings.map(setting => `
- ${setting.name}
  Description: ${setting.description || 'No description'}
  Type: ${setting.attributes?.type || 'Unspecified'}
  Features: ${setting.attributes?.features?.join(', ') || 'None specified'}
  Significance: ${setting.attributes?.significance?.join(', ') || 'None specified'}
`).join('\n')}

Connected Plot Points:
${connections.plotPoints.map(plot => `
- ${plot.name}
  Description: ${plot.description || 'No description'}
  Events: ${plot.attributes?.events?.join(', ') || 'None specified'}
  Impact: ${plot.attributes?.impact?.join(', ') || 'None specified'}
  Character Connections: ${plot.attributes?.connections?.join(', ') || 'None specified'}
`).join('\n')}

Chapter Beats:
${beats.map(b => `- ${b.title}: ${b.content}`).join('\n')}

Chapter Notes:
${notes.map(n => `- ${n.title}: ${n.content}`).join('\n')}
`;
        let prompt = '';
        switch (type) {
            case 'note':
                prompt = `You are a creative writing assistant. Based on the following context about this chapter, generate a note that could help develop the story further. The note should be insightful and relate to the existing content and metadata.

Context:
${contextString}

Generate a note with both a title and content. The content should be 2-3 sentences that provide a unique insight or idea related to this chapter.

Format your response EXACTLY like this, including the exact labels:
TITLE: [A short, specific title for the note]
CONTENT: [The actual note content without any prelude or explanation]`;
                break;
            case 'beat':
                prompt = `You are a creative writing assistant. Based on the following context about this chapter, generate a logical next story beat that would help move the narrative forward. Consider the existing beats and story elements.

Context:
${contextString}

Generate a new story beat with both a title and description. The description should be specific and actionable, helping to move the story forward in a meaningful way.

Format your response EXACTLY like this, including the exact labels:
TITLE: [A short, specific title for the beat]
CONTENT: [The beat description without any prelude or explanation]`;
                break;
            case 'text':
                prompt = `You are a creative writing assistant. Based on the following context about this chapter, generate a new paragraph that naturally fits into the current narrative. Consider all the existing story elements, character relationships, and plot points.

Context:
${contextString}

Current Location in Text: ${currentContent || 'Start of chapter'}

Generate a new paragraph (3-5 sentences) that flows naturally from the current content while considering all the chapter's metadata. The paragraph should maintain consistent tone and style with the existing text while advancing the story in a meaningful way.`;
                break;
            default:
                throw new Error('Invalid generation type');
        }
        // Initialize Gemini
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedContent = response.text().trim();
        // Parse title and content for notes and beats
        if (type === 'note' || type === 'beat') {
            const titleMatch = generatedContent.match(/TITLE:\s*(.+?)(?=\n|$)/);
            const contentMatch = generatedContent.match(/CONTENT:\s*(.+?)(?=\n|$)/);
            if (!titleMatch || !contentMatch) {
                throw new Error('Generated content did not match expected format');
            }
            return {
                generatedContent: JSON.stringify({
                    title: titleMatch[1].trim(),
                    content: contentMatch[1].trim()
                })
            };
        }
        return {
            generatedContent
        };
    }
    catch (error) {
        console.error('Error in generateAIContent:', error);
        throw new Error(error instanceof Error ? error.message : 'Unknown error in content generation');
    }
});
var ai_transform_1 = require("./ai-transform");
Object.defineProperty(exports, "transformText", { enumerable: true, get: function () { return ai_transform_1.transformText; } });
//# sourceMappingURL=index.js.map