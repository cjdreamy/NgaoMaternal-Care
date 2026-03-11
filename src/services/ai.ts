export async function generateAIResponse(prompt: string, type: 'chat' | 'suggestions' = 'chat') {
    try {
        console.log(`Calling Local Server (${type})...`);

        // When running locally, the server is on localhost:3001
        // In production on Render, it will use the same host or a relative path
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

        const response = await fetch(`${baseUrl}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }],
                type
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || `Server Error ${response.status}`);
        }

        const data = await response.json();
        return data.content || "No response received.";
    } catch (error: any) {
        console.error("AI Request Error:", error);

        if (error.message?.includes('Failed to fetch')) {
            return "AI Error: Could not connect to the local server. Make sure 'node server.js' is running.";
        }

        return `AI Error: ${error.message || "An unknown error occurred"}.`;
    }
}
