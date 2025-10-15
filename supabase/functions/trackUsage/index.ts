// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// serve(async (req) => {
//   const authHeader = req.headers.get("authorization") || "";
//   const token = authHeader.replace("Bearer ", "");

//   const { data: user } = await supabase.auth.getUser(token);
//   if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
//   const headers = {
//     "Content-Type": "application/json",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "POST, OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type",
//   };

//   if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

//   try {
//     const { user_id, action } = await req.json();
//     console.log(action);

//     if (!user_id || !action) return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers });

//     // 1️⃣ Get user profile
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("subscription_type, subscription_start, subscription_end")
//       .eq("id", user_id)
//       .single();

//     if (profileError || !profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers });

//     const limits: Record<string, { simplify: number; followup: number }> = {
//       free: { simplify: 10, followup: 5 },
//       basic: { simplify: 100, followup: 50 },
//       pro: { simplify: Infinity, followup: Infinity },
//     };

//     const planLimit = limits[profile.subscription_type.toLowerCase()];
//     if (!planLimit) return new Response(JSON.stringify({ error: "Invalid plan type" }), { status: 400, headers });

//     const now = new Date().toISOString();

//     // 2️⃣ Get or create usage row
//     let { data: usage } = await supabase
//       .from("usage")
//       .select("*")
//       .eq("user_id", user_id)
//       .gte("period_start", now)
//       .lte("period_end", now)
//       .maybeSingle();

//     if (!usage) {
//       const { data: newUsage } = await supabase
//         .from("usage")
//         .insert({
//           user_id,
//           simplify_count: 0,
//           followup_count: 0,
//           period_start: profile.subscription_start,
//           period_end: profile.subscription_end,
//         })
//         .select("*")
//         .single();
//       usage = newUsage;
//     }

//     // 3️⃣ Increment usage based on action
//     if (action === "simplify") {
//       if (usage.simplify_count >= planLimit.simplify)
//         return new Response(JSON.stringify({ error: "Simplify limit reached" }), { status: 403, headers });

//       await supabase
//         .from("usage")
//         .update({ simplify_count: usage.simplify_count + 1, updated_at: new Date().toISOString() })
//         .eq("id", usage.id);

//     } else if (action === "followup") {
//       if (usage.followup_count >= planLimit.followup)
//         return new Response(JSON.stringify({ error: "Followup limit reached" }), { status: 403, headers });

//       await supabase
//         .from("usage")
//         .update({ followup_count: usage.followup_count + 1, updated_at: new Date().toISOString() })
//         .eq("id", usage.id);

//     } else {
//       return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
//     }

//     return new Response(JSON.stringify({ ok: true, usage }), { headers });

//   } catch (err: any) {
//     return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
//   }
// });


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const { user_id, action } = await req.json();
    console.log("Received request:", action, user_id);

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers });
    }

    // 1️⃣ Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_type, subscription_start, subscription_end")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers });
    }

    // 2️⃣ Plan limits
    const limits: Record<string, { simplify: number; followup: number }> = {
      free: { simplify: 10, followup: 5 },
      basic: { simplify: 100, followup: 50 },
      pro: { simplify: Infinity, followup: Infinity },
    };

    const planLimit = limits[profile.subscription_type.toLowerCase()];
    if (!planLimit) return new Response(JSON.stringify({ error: "Invalid plan type" }), { status: 400, headers });
    const now = new Date().toISOString();

    // 3️⃣ Find usage row for this billing period
    let { data: usage, error: usageError } = await supabase
      .from("usage")
      .select("*")
      .eq("user_id", user_id)
      .lte("period_start", now)
      .gte("period_end", now)
      .maybeSingle();

    console.log("Profile dates:", profile.subscription_start, profile.subscription_end);
    if (usageError) console.error("Usage query error:", usageError);
    // 4️⃣ If no usage row, create one
    if (!usage) {
      const { data: newUsage, error: insertError } = await supabase
        .from("usage")
        .insert({
          user_id,
          simplify_count: 0,
          followup_count: 0,
          period_start: profile.subscription_start,
          period_end: profile.subscription_end,
        })
        .select("*")
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: "Failed to create usage row" }), { status: 500, headers });
      }
      usage = newUsage;
    }

    // 5️⃣ Enforce plan limit
    let updatedUsage;
    if (action === "simplify") {
      if (usage.simplify_count >= planLimit.simplify)
        return new Response(JSON.stringify({ error: "Simplify limit reached" }), { status: 403, headers });

      await supabase
        .from("usage")
        .update({ simplify_count: usage.simplify_count + 1, updated_at: new Date().toISOString() })
        .eq("id", usage.id);
      const { data } = await supabase.from("usage").select("*").eq("id", usage.id).single();
      updatedUsage = data;
    } else if (action === "followup") {
      if (usage.followup_count >= planLimit.followup)
        return new Response(JSON.stringify({ error: "Followup limit reached" }), { status: 403, headers });

      await supabase
        .from("usage")
        .update({ followup_count: usage.followup_count + 1, updated_at: new Date().toISOString() })
        .eq("id", usage.id);
      const { data } = await supabase.from("usage").select("*").eq("id", usage.id).single();
      updatedUsage = data;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ ok: true, usage: updatedUsage }), { headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
});
