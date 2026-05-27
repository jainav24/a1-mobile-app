const fetch = require('node-fetch');

async function test(modelName, method) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${method}`;
    
    let body;
    if (method === 'predict') {
        body = {
            instances: [{ prompt: "A small house" }],
            parameters: { sampleCount: 1 },
        };
    } else {
        body = {
            contents: [{ parts: [{ text: "A small house" }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        };
    }

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log(`\n--- ${modelName} ---`);
    console.log(JSON.stringify(data).substring(0, 300));
}

async function run() {
    await test('gemini-2.5-flash-image', 'generateContent');
    await test('imagen-4.0-generate-001', 'predict');
}

run();
