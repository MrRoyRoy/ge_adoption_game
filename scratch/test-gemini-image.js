const { execSync } = require('child_process');
const fetch = require('node-fetch');

async function test() {
  const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' }).trim();
  const url = 'https://us-central1-aiplatform.googleapis.com/v1/projects/ge-edu-demo/locations/us-central1/publishers/google/models/gemini-3.1-flash-lite-image:generateContent';

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
          text: 'Generate a futuristic cyberpunk city alleyway at night with glowing pink and cyan neon signs, high resolution, photorealistic.'
        }]
      }]
    })
  });

  console.log('Response Status:', response.status);
  const data = await response.json();
  console.log('Response JSON keys:', Object.keys(data));
  console.log('Response details:', JSON.stringify(data, null, 2).slice(0, 1000));
}

test().catch(console.error);
