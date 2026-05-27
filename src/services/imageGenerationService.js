/**
 * imageGenerationService.js
 * Calls the Gemini image-generation REST endpoint and returns
 * a base64 data URI for the generated image.
 */

const GEMINI_API_KEY = 'AIzaSyAdEho3aCwSL4rPBditmXy_0hoxx5aiFQw';
const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

/**
 * Generate an image from a text prompt using Gemini.
 *
 * @param {string} prompt  - The architectural text prompt
 * @returns {Promise<string|null>} - "data:image/png;base64,..." or null on failure
 */
export async function generateDesignImage(prompt) {
    try {
        const url = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;

        const body = {
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseModalities: ['image', 'text'],
            },
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[ImageGen] API error:', response.status, errText);
            throw new Error(`API returned ${response.status}: ${errText}`);
        }

        const data = await response.json();

        // Walk through candidates → content → parts to find inline image data
        const candidates = data?.candidates || [];
        for (const candidate of candidates) {
            const parts = candidate?.content?.parts || [];
            for (const part of parts) {
                if (part?.inlineData?.mimeType?.startsWith('image/')) {
                    const mimeType = part.inlineData.mimeType; // e.g. "image/png"
                    const b64 = part.inlineData.data;
                    return `data:${mimeType};base64,${b64}`;
                }
            }
        }

        console.error('[ImageGen] No image data in response:', JSON.stringify(data));
        return null;
    } catch (error) {
        console.error('[ImageGen] generateDesignImage failed:', error);
        return null;
    }
}
