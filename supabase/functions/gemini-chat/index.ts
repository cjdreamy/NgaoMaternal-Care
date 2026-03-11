import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = "https://api.llmapi.ai/v1/chat/completions";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { messages, type = 'chat' } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured in Edge Function secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare system message based on type
    let systemMessage = "";
    if (type === 'suggestions') {
      systemMessage = `You are a maternal health content curator. Suggest 5-7 high-quality maternal health resources including:
1. Recent maternal health articles from reputable sources (WHO, CDC, medical journals)
2. Educational YouTube videos about pregnancy and maternal care
3. Publications from maternal health doctors and experts
4. Evidence-based pregnancy guides

Format your response as a structured list with titles, brief descriptions, and why each resource is valuable.`;
    } else {
      systemMessage = `You are a compassionate maternal health assistant for NgaoMaternal Care. Provide:
- Evidence-based pregnancy and maternal health information
- Supportive and empathetic responses
- Clear guidance on when to seek medical attention
- Culturally sensitive advice

IMPORTANT: Always recommend consulting healthcare providers for medical concerns. You provide information, not medical diagnosis.`;
    }

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      stream: false
    };

    console.log("Calling LLMAPI with payload...");

    // Make request to OpenAI-compatible API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`AI API error (${response.status}):`, responseText);
      return new Response(
        JSON.stringify({ error: `AI Service Error ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI response:", responseText);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from AI service", details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Internal Error in AI chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
