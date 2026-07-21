const { GoogleAuth } = require('google-auth-library');
const dotenv = require('dotenv');
dotenv.config();

const PROJECT_ID = process.env.PROJECT_ID || 'ge-edu-demo';
const LOCATION = process.env.LOCATION || 'global';
const IMAGEN_MODEL = process.env.IMAGEN_MODEL || 'gemini-3.1-flash-lite-image';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Resolve appropriate API endpoint. If LOCATION is global, call via us-central1 endpoint
const API_ENDPOINT = process.env.API_ENDPOINT || (LOCATION === 'global' ? 'us-central1-aiplatform.googleapis.com' : `${LOCATION}-aiplatform.googleapis.com`);

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

async function getAuthToken() {
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('Error getting Google access token:', error);
    throw error;
  }
}

/**
 * Generate image using Vertex AI Image model
 */
async function generateImage(prompt) {
  const token = await getAuthToken();
  const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;
  
  console.log(`Calling Image Generation model [${IMAGEN_MODEL}] in region [${LOCATION}]...`);
  console.log(`URL: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Imagen Generation Failed. Status: ${response.status}`, errText);
    throw new Error(`Imagen Generation Failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  if (!result.predictions || result.predictions.length === 0) {
    throw new Error('Imagen returned empty predictions list');
  }

  const base64Image = result.predictions[0].bytesBase64Encoded;
  return base64Image; // returns base64 jpeg data
}

/**
 * Perform multimodal evaluation using Gemini Flash
 */
async function evaluateImages(masterBase64, userBase64, userPrompt) {
  const token = await getAuthToken();
  // For Gemini, we typically hit the regional endpoint (e.g. us-central1) if global isn't available, or keep it standard.
  const url = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${GEMINI_MODEL}:generateContent`;

  console.log(`Calling Gemini evaluation model [${GEMINI_MODEL}]...`);
  console.log(`URL: ${url}`);

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

  const requestBody = {
    contents: {
      role: 'user',
      parts: [
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
      ]
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Gemini Evaluation Failed. Status: ${response.status}`, errText);
    throw new Error(`Gemini Evaluation Failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  if (!result.candidates || result.candidates.length === 0) {
    throw new Error('Gemini evaluation returned empty candidates list');
  }

  const textResponse = result.candidates[0].content.parts[0].text;
  return JSON.parse(textResponse);
}

module.exports = {
  generateImage,
  evaluateImages
};
