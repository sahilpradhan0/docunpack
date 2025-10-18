import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight (optional, only if you plan to test via browser)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const event = await req.json();
    const userId = event.user_id;
    const planId = event.plan_id;

    if (!userId || !planId) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or plan_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine billing interval from planId
    const interval = planId.includes("monthly") ? "monthly" : "yearly";

    // Calculate start and end dates
    const startDate = new Date();
    let endDate = new Date(startDate);
    if (interval === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    if (interval === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);

    switch (event.type) {
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.plan_changed":
        await supabase
          .from("profiles")
          .update({
            subscription_type: planId,
            subscription_start: startDate.toISOString(),
            subscription_end: endDate.toISOString(),
            billing_interval: interval,
          })
          .eq("id", userId);
        console.log(`Profile ${userId} updated to plan ${planId}`);
        break;

      case "subscription.cancelled":
      case "subscription.expired":
        await supabase
          .from("profiles")
          .update({
            subscription_type: "free",
            subscription_start: null,
            subscription_end: null,
            billing_interval: null,
          })
          .eq("id", userId);
        console.log(`Profile ${userId} downgraded to free`);
        break;

      case "subscription.failed":
      case "subscription.on_hold":
        await supabase
          .from("profiles")
          .update({ subscription_type: "on_hold" })
          .eq("id", userId);
        console.log(`Profile ${userId} plan status: ${event.type}`);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
