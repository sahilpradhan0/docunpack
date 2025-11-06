import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  console.log("🔥 Function invoked", req.method, new Date().toISOString());
  const KIT_API_KEY = Deno.env.get("KIT_API_KEY");
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }


  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Access-Control-Allow-Origin": "*" } });
  }

  console.log("KIT_API_KEY:", Deno.env.get("KIT_API_KEY"));
  try {
    const { email, planType, formType } = await req.json();
    console.log("Email", email, "FORM Type", formType);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } },);
    }

    // Map form IDs and tags based on form type
    const formMapping = {
      newsletter: { formId: "8595331", tagId: 11001941 },
      waitlist: { formId: "8595333", tagId: 11001934 }
    };

    const { formId, tagId } = formMapping[formType] || {};

    if (!formId || !tagId) {
      return new Response(JSON.stringify({ error: "Invalid form type" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
        fields: planType ? { plantype: planType } : undefined,
        tags: [tagId],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    return new Response(JSON.stringify({ message: "Subscribed successfully!" }), { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});
