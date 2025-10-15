import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { question, context: docContext } = await req.json();
    console.log("🔹 Received body:", { question, hasContext: !!docContext });

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    console.log("🔹 GEMINI_API_KEY exists:", !!geminiKey);

    const authHeader = req.headers.get("Authorization") || "";
    console.log("🔹 Auth Header present:", !!authHeader);

    // rest of your code ...

    if (!question || !docContext) {
      return new Response(JSON.stringify({ error: "Missing question or context" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(jwt);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // ✅ Call Gemini API from the server
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Here is the output:\n\n${docContext}\n\nAnswer this question:\n${question}`,
                },
              ],
            },
          ],
        }),
      }
    );
    console.log("Gemini status:", res.status);

    const text = await res.text(); // get raw response
    console.log("Gemini raw response:", text.slice(0, 200));
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "Gemini returned non-JSON response", raw: text.slice(0, 200) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const answer = json.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return new Response(JSON.stringify({ answer }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (e) {
    console.log("Edge function error", e);

    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
