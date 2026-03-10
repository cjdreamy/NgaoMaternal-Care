import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIResponse(prompt: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_key_here") {
        return "api not found , Please configure your VITE_GEMINI_API_KEY in the .env file.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        return `AI Error: ${error.message || "Unknown error"}.`;
    }
}
