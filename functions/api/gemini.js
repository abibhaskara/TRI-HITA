export async function onRequestPost(context) {
  const { env, request } = context;
  const API_KEY = env.GEMINI_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API Key not configured in Cloudflare Secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { prompt, history, systemInstruction } = await request.json();

    // Prepare contents for Gemini API
    // History should be an array of { role: 'user'|'model', parts: [{ text: '...' }] }
    const contents = history || [];
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const body = {
      contents: contents
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: data.error?.message || "Error from Gemini API",
        status: response.status 
      }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract just the text to keep it simple for the frontend
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

    return new Response(JSON.stringify({ text: aiText }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
