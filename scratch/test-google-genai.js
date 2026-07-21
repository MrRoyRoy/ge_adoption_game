const { GoogleGenAI } = require('@google/genai');

async function run() {
  console.log('Initializing GoogleGenAI in Vertex AI mode...');
  
  // Use vertexai: true (NOT vertex: true) to enable Vertex AI and use local OAuth credentials!
  const ai = new GoogleGenAI({
    vertexai: true,
    project: 'ge-edu-demo',
    location: 'global'
  });

  const model = 'gemini-3.1-flash-lite-image';
  console.log(`Sending generateContent request to ${model} in location global...`);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: 'Generate a stunning minimalism classic art piece representing a glowing neon cat'
    });

    console.log('API call successful!');
    console.log('Full Response keys:', Object.keys(response));
    
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        console.log(`Parts count: ${candidate.content.parts.length}`);
        candidate.content.parts.forEach((part, idx) => {
          if (part.inlineData) {
            console.log(`- Part ${idx} has inlineData! mimeType: ${part.inlineData.mimeType}, data length: ${part.inlineData.data.length}`);
            console.log(`- Data snippet: ${part.inlineData.data.slice(0, 100)}...`);
          } else if (part.text) {
            console.log(`- Part ${idx} has text: ${part.text.slice(0, 150)}...`);
          } else {
            console.log(`- Part ${idx} details:`, JSON.stringify(part));
          }
        });
      }
    }
  } catch (error) {
    console.error('Error during GoogleGenAI call:', error);
  }
}

run();
