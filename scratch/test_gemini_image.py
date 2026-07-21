import os
import sys
from google import genai
from google.genai import types

def generate():
    # Set proxy or fetch configurations if any
    client = genai.Client(
        vertexai=True,
    )
    
    # We can use a simple text prompt to generate an image
    model = "gemini-3.1-flash-lite-image"
    contents = "Generate a futuristic cyberpunk city alleyway at night with glowing pink and cyan neon signs, high resolution, photorealistic."
    
    print("Calling model:", model)
    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
        )
        print("Response successful!")
        # Let's inspect the parts of the response candidates
        for candidate in response.candidates:
            for part in candidate.content.parts:
                print("Part type:", type(part))
                # Print available fields
                fields = [f for f in dir(part) if not f.startswith('_')]
                print("Part fields:", fields)
                if part.inline_data:
                    print("Has inline_data! mime_type:", part.inline_data.mime_type)
                    print("inline_data length:", len(part.inline_data.data))
                    # Print first 100 chars of base64
                    b64_str = part.inline_data.data[:100] if isinstance(part.inline_data.data, str) else part.inline_data.data.decode('utf-8')[:100]
                    print("Base64 snippet:", b64_str)
                if part.text:
                    print("Has text:", part.text)
    except Exception as e:
        print("Error during python generate:", e)

if __name__ == '__main__':
    generate()
