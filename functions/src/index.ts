import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const db = getFirestore();

const geminiKey = defineSecret("GEMINI_KEY");

interface Section {
  relevantText: string;
  confidence: number;
}

interface CharacterSection extends Section {
  characterName: string;
}

interface LocationSection extends Section {
  locationName: string;
}

interface EventSection extends Section {
  eventName: string;
}

interface InitialProcessingResult {
  category: string;
  confidence: number;
  tags: string[];
  sectionsToProcess: {
    characters?: CharacterSection[];
    locations?: LocationSection[];
    events?: EventSection[];
  };
}

// Initial categorization and processing
export const processNote = onCall({ secrets: [geminiKey] }, async (request) => {
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
    const genAI = new GoogleGenerativeAI(apiKey);
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
    
    const initialProcessing = JSON.parse(cleanJson) as InitialProcessingResult;
    console.log('Parsed initial processing result:', initialProcessing);

    // Filter sections based on confidence threshold
    const CONFIDENCE_THRESHOLD = 0.8;
    const sectionsToProcess = {
      characters: initialProcessing.sectionsToProcess.characters?.filter((c: CharacterSection) => c.confidence >= CONFIDENCE_THRESHOLD) || [],
      locations: initialProcessing.sectionsToProcess.locations?.filter((l: LocationSection) => l.confidence >= CONFIDENCE_THRESHOLD) || [],
      events: initialProcessing.sectionsToProcess.events?.filter((e: EventSection) => e.confidence >= CONFIDENCE_THRESHOLD) || []
    };

    // Process each entity type if needed
    const extractedEntities: any = {
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
    const characterNames = extractedEntities.characters.map((char: any) => ({
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
      characters: extractedEntities.characters.map((c: any) => c.name),
      locations: extractedEntities.locations.map((l: any) => l.name),
      events: extractedEntities.events.map((e: any) => e.name)
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
        characters: extractedEntities.characters.map((c: { name: string }) => c.name),
        locations: extractedEntities.locations.map((l: { name: string }) => l.name),
        events: extractedEntities.events.map((e: { name: string }) => e.name)
      }
    });

    await batch.commit();
    console.log('All entities stored successfully');

    return finalResponse;

  } catch (error) {
    console.error('Error in note processing:', error);
    throw error;
  }
});

// Add new clearDatabase function
export const clearDatabase = onCall(async (request) => {
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

  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}); 