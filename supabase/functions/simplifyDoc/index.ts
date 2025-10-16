import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import "https://deno.land/std@0.177.0/dotenv/load.ts";
// import { gzipEncode } from "https://deno.land/x/wasm_gzip@v1.0.0/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
function extractMarkdownFromHTML(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const elements = Array.from(
    doc.querySelectorAll(
      "h1,h2,h3,h4,h5,h6,p,ul,ol,li,pre,code,blockquote,a,hr,img,table,thead,tr,th,td,div,span"
    )
  );

  const markdownLines: string[] = [];

  elements.forEach((el: any) => {
    const tag = el.tagName.toLowerCase();

    switch (tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
        markdownLines.push(`${"#".repeat(parseInt(tag[1]))} ${el.textContent?.trim()}`);
        break;
      case "p":
        markdownLines.push(`${el.textContent?.trim()}`);
        break;
      case "ul":
        const ulItems = Array.from(el.querySelectorAll("li")).map(li => `- ${li.textContent?.trim()}`);
        markdownLines.push(ulItems.join("\n"));
        break;
      case "ol":
        const olItems = Array.from(el.querySelectorAll("li")).map((li, i) => `${i + 1}. ${li.textContent?.trim()}`);
        markdownLines.push(olItems.join("\n"));
        break;
      case "pre":
      case "code":
        markdownLines.push(`\`\`\`\n${el.textContent?.trim()}\n\`\`\``);
        break;
      case "blockquote":
        markdownLines.push(`> ${el.textContent?.trim()}`);
        break;
      case "a":
        markdownLines.push(`[${el.textContent?.trim()}](${el.href})`);
        break;
      case "hr":
        markdownLines.push(`---`);
        break;
      case "img":
        markdownLines.push(`![${el.alt || ""}](${el.src})`);
        break;
      case "table":
        const rows = Array.from(el.querySelectorAll("tr")).map(tr =>
          Array.from(tr.querySelectorAll("th, td")).map(td => td.textContent?.trim()).join(" | ")
        );
        markdownLines.push(rows.join("\n"));
        break;
      default:
        const text = el.textContent?.trim() || "";
        if (text) markdownLines.push(text);
    }
  });
  if (markdownLines.length === 0) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return markdownLines.join("\n\n");
}
function isCloudflareProtected(html: string) {
  // Look for Cloudflare challenge indicators in the HTML
  const lowerHtml = html.toLowerCase();
  return (
    lowerHtml.includes("_cf_chl_opt") || // JS challenge object
    lowerHtml.includes("jschl_vc") ||    // old-style challenge
    lowerHtml.includes("__cf_chl_tk") || // token param
    lowerHtml.includes("cf-browser-verification") // generic CF page
  );
}

serve(async (req) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*", // restrict to your domain later
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided" }), { status: 400, headers });
    }

    const response = await fetch(url);
    let text = await response.text();

    // Convert JSON to string
    // const body = JSON.stringify({ content: text });
    
    if (isCloudflareProtected(text)) {
      return new Response(
        JSON.stringify({
          error: "cloudflare_protected",
          message: "This link is protected by Cloudflare. Please paste the text instead."
        }),
        { status: 400, headers }
      );
    }
    // let body = extractMarkdownFromHTML(text);
    if (!text.trim()) {
      const jinaResp = await fetch(`https://r.jina.ai/${url}`);
      text = await jinaResp.text();
    }
    // Compress it
    // const compressed = gzipEncode(new TextEncoder().encode(body));

    return new Response(JSON.stringify({ content: text }), {
      headers: {
        ...headers,
        "Content-Type": "application/json",
        // "Content-Encoding": "gzip",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
  }
});

// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { GoogleGenAI } from "https://esm.sh/@google/genai";
// import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// const ai = new GoogleGenAI({
//   apiKey: Deno.env.get("GEMINI_API_KEY")!,
// });

// function looksLikeUrl(input: string) {
//   try { new URL(input); return true; } catch { return false; }
// }

// // --- Convert HTML document to Markdown ---
// function extractMarkdownFromHTML(html: string) {
//   const doc = new DOMParser().parseFromString(html, "text/html");
//   if (!doc) return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

//   const elements = Array.from(
//     doc.querySelectorAll(
//       "h1,h2,h3,h4,h5,h6,p,ul,ol,li,pre,code,blockquote,a,hr,img,table,thead,tr,th,td"
//     )
//   );

//   const markdownLines: string[] = [];

//   elements.forEach((el: any) => {
//     const tag = el.tagName.toLowerCase();

//     switch (tag) {
//       case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
//         markdownLines.push(`${"#".repeat(parseInt(tag[1]))} ${el.textContent?.trim()}`);
//         break;
//       case "p":
//         markdownLines.push(`${el.textContent?.trim()}`);
//         break;
//       case "ul":
//         const ulItems = Array.from(el.querySelectorAll("li")).map(li => `- ${li.textContent?.trim()}`);
//         markdownLines.push(ulItems.join("\n"));
//         break;
//       case "ol":
//         const olItems = Array.from(el.querySelectorAll("li")).map((li, i) => `${i + 1}. ${li.textContent?.trim()}`);
//         markdownLines.push(olItems.join("\n"));
//         break;
//       case "pre":
//       case "code":
//         markdownLines.push(`\`\`\`\n${el.textContent?.trim()}\n\`\`\``);
//         break;
//       case "blockquote":
//         markdownLines.push(`> ${el.textContent?.trim()}`);
//         break;
//       case "a":
//         markdownLines.push(`[${el.textContent?.trim()}](${el.href})`);
//         break;
//       case "hr":
//         markdownLines.push(`---`);
//         break;
//       case "img":
//         markdownLines.push(`![${el.alt || ""}](${el.src})`);
//         break;
//       case "table":
//         const rows = Array.from(el.querySelectorAll("tr")).map(tr =>
//           Array.from(tr.querySelectorAll("th, td")).map(td => td.textContent?.trim()).join(" | ")
//         );
//         markdownLines.push(rows.join("\n"));
//         break;
//       default:
//         markdownLines.push(el.textContent?.trim() || "");
//     }
//   });

//   return markdownLines.join("\n\n");
// }


// // --- Edge Function ---
// serve(async (req) => {
//   const headers: Record<string, string> = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "POST, OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type, Authorization",
//   };

//   if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

//   try {
//     const { input } = await req.json();
//     if (!input) return new Response(JSON.stringify({ error: "No input provided" }), { status: 400, headers });

//     let textContent = "";

//     if (looksLikeUrl(input)) {
//       const res = await fetch(input);
//       const html = await res.text();

//       // Extract Markdown from the parsed document
//       // textContent = extractMarkdownFromHTML(html);
//       textContent = JSON.stringify({ content: html });
//     } else {
//       textContent = input.trim();
//     }
//     if (!textContent)
//       return new Response(
//         JSON.stringify({ error: "Could not extract any content." }),
//         { status: 400, headers }
//       );
//     const prompt = `You are a senior developer explaining documentation to a junior developer.
//         Simplify the following documentation in **Markdown** format.
//         Preserve all existing structure such as headings, bullet points, tables, links, images, code blocks, and blockquotes.
//         Text: ${textContent}`;
//     const result = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//     });
//     const summary = result?.candidates[0]?.content?.parts[0].text || "";
//     if (!summary)
//       return new Response(
//         JSON.stringify({ error: "No summary generated." }),
//         { status: 500, headers }
//       );

//     return new Response(JSON.stringify({ summary }), {
//       status: 200,
//       headers: { ...headers, "Content-Type": "application/json" },
//     });
//   } catch (err: any) {
//     console.error(err);
//     return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
//   }
// });
