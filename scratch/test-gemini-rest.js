const { execSync } = require('child_process');
const fetch = require('node-fetch');

async function test() {
  const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' }).trim();
  const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/ge-edu-demo/locations/global/publishers/google/models/gemini-3.1-flash-lite-image:generateContent';

  console.log('Token fetched successfully.');
  console.log('Sending request to Vertex AI...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{
          text: 'Generate a stunning minimalism classic art piece representing a glowing neon cat'
        }]
      }]
    })
  });

  console.log('Response Status:', response.status);
  const data = await response.json();
  if (data.error) {
    console.error('API Error:', JSON.stringify(data.error, null, 2));
    return;
  }
  
  console.log('Response keys:', Object.keys(data));
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    const parts = data.candidates[0].content.parts;
    console.log('Parts count:', parts.length);
    parts.forEach((part, idx) => {
      console.log(`Part ${idx} keys:`, Object.keys(part));
      if (part.inlineData) {
        console.log(`- mimeType: ${part.inlineData.mimeType}`);
        console.log(`- data length: ${part.inlineData.data.length}`);
        console.log(`- data prefix: ${part.inlineData.data.slice(0, 100)}...`);
      }
    });
  } else {
    console.log('Unexpected response JSON:', JSON.stringify(data, null, 2).slice(0, 500));
  }
}

test().catch(console.error);
