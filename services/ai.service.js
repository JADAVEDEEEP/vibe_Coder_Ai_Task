const { GoogleGenAI } = require("@google/genai");

/**
 * ============================================================
 * Gemini Configuration
 * ============================================================
 *
 * Create Gemini Client using environment variables.
 * Supports both GEMINI_API_KEY and GEMINI_API_KEYa (Render-style)
 * so deployment environments can work without code changes.
 */
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYa;

const ai = geminiApiKey ? new GoogleGenAI({
    apiKey: geminiApiKey,
}) : null;

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

You are Workforce Pulse AI Assistant.

Answer ONLY using the dashboard data provided below.

If the required information is not available,
reply exactly:

Data not available in the current dataset.

====================================================
Dashboard Summary
====================================================

Recoverable Hours:
${dashboard.recoverableHours}

Recoverable Money:
₹${dashboard.recoverableMoney}

====================================================
Department Breakdown
====================================================

${dashboard.departmentBreakdown
    .map(d => `${d.department}: ${d.hours} hrs`)
    .join("\n")}

====================================================
Application Breakdown
====================================================

${dashboard.appBreakdown
    .map(a => `${a.app}: ${a.hours} hrs`)
    .join("\n")}

====================================================
Top Automation Opportunities
====================================================

${dashboard.automationRanking
    .slice(0, 10)
    .map((t, index) => `
${index + 1}. ${t.task}
Recoverable Hours: ${t.repetitiveHours.toFixed(2)}
Recoverable Money: ₹${t.recoverableMoney.toFixed(2)}
`)
    .join("\n")}

====================================================
Weekly Trend
====================================================

${dashboard.weeklyTrend
    .map(w => `${w.week}: ${w.hours} hrs`)
    .join("\n")}

====================================================
Detected Anomalies
====================================================

${dashboard.anomalies.length
        ? dashboard.anomalies
            .map(a =>
                `${a.type} | Employee ${a.employeeId} | ${a.task || ""}`
            )
            .join("\n")
        : "No anomalies detected"}

====================================================
Instructions
====================================================

1. Never invent numbers.

2. Never estimate.

3. Never assume.

4. Use ONLY the dashboard data.

5. If multiple answers exist,
summarize clearly.

6. Answer like a COO business assistant.

7. Keep answers concise.

====================================================
User Question

${question}

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

        if (!geminiApiKey || !ai) {
            return "Gemini API key is not configured. Please set GEMINI_API_KEY or GEMINI_API_KEYa.";
        }

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
