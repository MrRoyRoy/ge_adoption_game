const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID || 'ge-edu-demo';
const LOCATION = process.env.LOCATION || 'global';
const IMAGEN_MODEL = process.env.IMAGEN_MODEL || 'gemini-3.1-flash-lite-image';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

// Initialize the next-gen Google GenAI SDK
// Using vertexai: true automatically resolves default OAuth credentials (ADC) and coordinates with project scopes.
const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION
});

/**
 * Generate image using Gemini 3.1 Flash Lite Image model
 */
async function generateImage(prompt) {
  console.log(`Calling Image Generation model [${IMAGEN_MODEL}] in region [${LOCATION}]...`);
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGEN_MODEL,
      contents: prompt
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('Model returned empty predictions list');
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Model returned empty content parts');
    }

    const part = candidate.content.parts[0];
    if (!part.inlineData) {
      throw new Error('Model candidate did not contain inlineData (image bytes)');
    }

    return part.inlineData.data; // returns base64 jpeg/png data
  } catch (error) {
    console.error('Error generating image via Vertex GenAI:', error);
    throw error;
  }
}

/**
 * Perform multimodal evaluation using Gemini Flash
 */
async function evaluateImages(masterBase64, userBase64, userPrompt) {
  console.log(`Calling Gemini evaluation model [${GEMINI_MODEL}]...`);
  
  const systemInstruction = `You are an expert AI Art Director and prompt engineering coach. Your task is to evaluate a user's generated image against a "Master Image" that they tried to recreate using prompt engineering.
  Analyze BOTH images.
  Generate your response ONLY as a JSON block with the following fields:
  {
    "score": <Integer from 1-100>,
    "rubric": {
      "styleAndAesthetic": <Integer from 1-25>,
      "compositionAndLayout": <Integer from 1-25>,
      "colorAndLighting": <Integer from 1-25>,
      "subjectAndAccuracy": <Integer from 1-25>
    },
    "suggestions": [
      "Detail 1 regarding prompt keyword adjustments",
      "Detail 2 regarding lighting/style modifications",
      "Detail 3 regarding camera angle/rendering descriptors"
    ],
    "commentary": "A short, professional, and encouraging summary of their attempt."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: `User Prompt Submitted: "${userPrompt}"` },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: masterBase64
          }
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: userBase64
          }
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('Gemini evaluation returned empty candidates list');
    }

    const textResponse = response.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse);
  } catch (error) {
    console.error('Error evaluating images via Vertex GenAI:', error);
    throw error;
  }
}

/**
 * Perform interactive LLM chat for Game 2 (Keep Koopa)
 */
async function chatWithLLM(systemInstruction, userPrompt, chatHistory = []) {
  console.log(`Calling Gemini chat model [${GEMINI_MODEL}] for Game 2 task...`);

  // Build formatted contents from chat history + new user prompt
  const contents = [];
  if (Array.isArray(chatHistory)) {
    for (const msg of chatHistory) {
      contents.push({
        role: msg.sender === 'USER' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
  }
  
  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('Gemini chat returned empty candidates list');
    }

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error in Game 2 LLM chat via Vertex GenAI:', error);
    throw error;
  }
}

module.exports = {
  generateImage,
  evaluateImages,
  chatWithLLM
};
