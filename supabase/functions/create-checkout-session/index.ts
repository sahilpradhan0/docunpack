import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Dodo API key
const DODO_API_KEY = Deno.env.get("DODO_API_KEY");

// Base URL configuration (uses http:// for local, but HTTPS for production secret)
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "http://localhost:5173";

serve(async (req) => {
  // --- Handle CORS preflight ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // --- Only allow POST ---
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    if (!DODO_API_KEY) {
      return new Response(JSON.stringify({ error: "DODO_API_KEY not set" }), { status: 500 });
    }
    const { plan, interval } = await req.json();
    if (!plan || !interval) {
      return new Response(JSON.stringify({ error: "Missing plan or interval" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // --- Get user from Supabase session ---
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Dodo only needs the base path, it will append ?status=...
    const returnUrl = `${APP_BASE_URL}/app`;
    console.log(`Sending Dodo return_url: ${returnUrl}`);

    // --- Call DodoPayment API ---
    const dodoRes = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_cart: [{ product_id: plan, quantity: 1 }],
        interval: interval,
        metadata: { user_id: user.id },
        // ✅ CORRECTED: Using Dodo's required 'return_url' parameter
        return_url: returnUrl,
      }),
    });

    const text = await dodoRes.text();
    console.log("Dodo status:", dodoRes.status);
    console.log("Dodo raw response:", text);

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse Dodo JSON:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON from Dodo", raw: text }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (!data.checkout_url) {
      return new Response(JSON.stringify({ error: "Failed to create checkout session", raw: data }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ checkout_url: data.checkout_url }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    console.error("Checkout session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
