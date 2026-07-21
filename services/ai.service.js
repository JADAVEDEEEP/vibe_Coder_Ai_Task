const { GoogleGenAI } = require("@google/genai");

/**
 * ============================================================
 * Gemini Configuration
 * ============================================================
 *
 * Create Gemini Client using environment variables.
 */
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * ============================================================
 * Build AI Prompt
 * ============================================================
 *
 * Purpose
 * -------
 * Convert dashboard data into prompt
 * for Gemini AI.
 */

const buildPrompt = (dashboard, question) => {

    return `

You are an AI Workforce Analytics Assistant.

You MUST answer ONLY using the provided dashboard data.

If the answer is not present in the data,
reply:

"Data not available in the current dataset."

---------------------------------------------------

Dashboard Data

${JSON.stringify(dashboard, null, 2)}

---------------------------------------------------

User Question

${question}

---------------------------------------------------

Rules

1. Never hallucinate.

2. Never create fake numbers.

3. Every answer must be based only on dashboard data.

4. If information is missing,
reply exactly:

"Data not available in the current dataset."

`;

};

/**
 * ============================================================
 * Ask Gemini
 * ============================================================
 *
 * Purpose
 * -------
 * Send prompt to Gemini
 * and return AI response.
 */

const askAI = async (dashboard, question) => {

    try {

        // Build Prompt
        const prompt = buildPrompt(
            dashboard,
            question
        );

        // Generate AI Response
        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: prompt

        });

        // Return AI text
        return response.text;

    } catch (error) {

        console.error("Gemini Error :", error.message);

        return "Unable to generate AI response.";

    }

};

module.exports = {

    buildPrompt,

    askAI

};
