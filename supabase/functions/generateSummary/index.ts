import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai";


const ai = new GoogleGenAI({
  apiKey: Deno.env.get("GEMINI_API_KEY")!,
});

serve(async (req) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*", // restrict in prod
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  try {
    const { apiText } = await req.json();

    if (!apiText) {
      return new Response(JSON.stringify({ error: "No text provided" }), { status: 400, headers });
    }

    const prompt = `You are an expert software engineer. Summarize and simplify the following API documentation in **Markdown**, keeping it concise, clear, and professional. Include headings, bullet points, and code blocks where helpful. Avoid addressing the reader directly.

${apiText}`;


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    console.log(response);

    return new Response(JSON.stringify({ summary: response.text }), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers,
    });
  }
});
