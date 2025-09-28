import fetch from "node-fetch";

export async function callGemini(prompt: string, temperature = 0.0, maxOutputTokens = 8192) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");
  const model = process.env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

   const body = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      response_mime_type: "application/json", 
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini call failed: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  try {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (e) {
    console.error("Error parsing Gemini response:", JSON.stringify(data, null, 2));
    throw new Error("Could not parse text from Gemini response.");
  }
}
