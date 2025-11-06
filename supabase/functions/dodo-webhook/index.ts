// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// // import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";
// console.log("🚀 Dodo webhook deployed successfully");
// const subtle = crypto.subtle;
// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL") ?? "",
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
// );

// const DODO_WEBHOOK_SECRET = Deno.env.get("DODO_WEBHOOK_SECRET");

// // KEEP THIS FUNCTION (It correctly handles Base64URL encoding)
// function base64UrlToUint8Array(base64Url: string) {
//   // Replace Base64URL chars with standard Base64 chars
//   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
//   const base64Padded = base64 + padding;
//   const binary = atob(base64Padded); // Standard atob now works
//   const bytes = new Uint8Array(binary.length);
//   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
//   return bytes;
// }

// // ***REPLACE*** the original 'decodeSecret' with this logic:
// function decodeSecret(secret: string) {
//   // 1. Strip "whsec_" prefix if present
//   const cleaned = secret.replace(/^whsec_/, "");

//   // 2. Use the Base64URL decoder for the secret (This is the critical fix)
//   return base64UrlToUint8Array(cleaned);
// }

// // **REVISED verifySvixSignature**
// async function verifySvixSignature(rawBody: string, signature: string, timestamp: string) {
//   const encoder = new TextEncoder();

//   // 1. Check for the timestamp prefix in the signature header and extract the signature
//   const parts = signature.split(",");
//   const sigPart = parts.find(p => p.startsWith("v1=")) || parts.find(p => !p.startsWith("t="));

//   if (!sigPart) {
//     console.log("❌ Signature part 'v1=' not found in header.");
//     return false;
//   }

//   // Extract the base64 signature value
//   const sig = sigPart.split("=")[1];
//   const signatureBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));

//   // 2. Decode the secret key
//   // Assuming DODO_WEBHOOK_SECRET is stored as a standard Base64 string (potentially with 'whsec_' prefix)
//   const secretBytes = decodeSecret(DODO_WEBHOOK_SECRET ?? "");

//   const key = await crypto.subtle.importKey(
//     "raw",
//     secretBytes,
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["verify"]
//   );

//   // 3. Construct the payload string for HMAC verification: ${timestamp}.${rawBody}
//   // The timestamp MUST be the Unix timestamp from the header, NOT the ISO string from the body.
//   const signedPayload = `${timestamp}.${rawBody}`;

//   // 4. Verify the signature
//   const ok = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(signedPayload));

//   if (ok) {
//     console.log(`✅ Signature matched standard pattern: ${signedPayload}`);
//     return true;
//   }

//   console.log("❌ No signature match for the standard pattern.");
//   // console.log("Payload attempted:", signedPayload); // Uncomment for debugging
//   return false;
// }


// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", {
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "POST, OPTIONS",
//         "Access-Control-Allow-Headers": "content-type, webhook-signature, webhook-timestamp",
//       },
//     });
//   }
//   try {
//     if (req.method !== "POST") {
//       return new Response(JSON.stringify({ error: "Method not allowed" }), {
//         status: 405,
//         headers: { "Content-Type": "application/json" },
//       });
//     }
//     console.log("🧩 Checking secret...");
//     console.log("DODO_WEBHOOK_SECRET exists:", !!Deno.env.get("DODO_WEBHOOK_SECRET"));

//     const rawBody = await req.text();
//     // Dodo actually sends "webhook-signature" and "webhook-timestamp"
//     const signature = req.headers.get("webhook-signature");
//     const timestamp = req.headers.get("webhook-timestamp");

//     console.log("🧩 Headers:", Object.fromEntries(req.headers));

//     if (!DODO_WEBHOOK_SECRET || !signature) {
//       console.error("Missing secret or signature");
//       return new Response(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const isValid = await verifySvixSignature(rawBody, signature, timestamp);

//     if (!isValid) {
//       console.error("Invalid signature");
//       console.log({ rawBody, signature, timestamp });
//       return new Response(JSON.stringify({ error: "Invalid signature" }), {
//         status: 403,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const event = JSON.parse(rawBody);
//     const { type, data: Data } = event;
//     console.log("📦 Incoming Dodo event:", type);
//     console.log("🧾 Raw data:", Data);

//     const user_id = Data?.metadata?.user_id;
//     const plan_id = Data?.product_id;

//     if (!user_id || !plan_id) {
//       console.error("Missing user_id or plan_id in event:", event);
//       return new Response(JSON.stringify({ error: "Invalid event data" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const interval = plan_id.includes("monthly") ? "monthly" : "yearly";
//     const startDate = new Date();
//     const endDate = new Date(startDate);
//     if (interval === "monthly") endDate.setMonth(endDate.getMonth() + 1);
//     if (interval === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);

//     switch (type) {
//       case "subscription.active":
//       case "subscription.renewed":
//       case "subscription.plan_changed":
//         await supabase.from("profiles").update({
//           subscription_type: plan_id,
//           subscription_start: startDate.toISOString(),
//           subscription_end: endDate.toISOString(),
//           billing_interval: interval,
//         }).eq("id", user_id);
//         console.log(`✅ User ${user_id} upgraded to ${plan_id}`);
//         break;

//       case "subscription.cancelled":
//       case "subscription.expired":
//         await supabase.from("profiles").update({
//           subscription_type: "free",
//           subscription_start: null,
//           subscription_end: null,
//           billing_interval: null,
//         }).eq("id", user_id);
//         console.log(`⚠️ User ${user_id} downgraded to free plan`);
//         break;

//       case "subscription.failed":
//       case "subscription.on_hold":
//         await supabase.from("profiles").update({
//           subscription_type: "on_hold",
//         }).eq("id", user_id);
//         console.log(`⚠️ User ${user_id} subscription on hold`);
//         break;

//       default:
//         console.log("ℹ️ Unhandled Dodo event:", type);
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("❌ Webhook error:", error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// });


// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// // import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";
// console.log("🚀 Dodo webhook deployed successfully");
// const subtle = crypto.subtle;
// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL") ?? "",
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
// );

// // We will defensively trim the secret when retrieved
// const DODO_WEBHOOK_SECRET = Deno.env.get("DODO_WEBHOOK_SECRET")?.trim();

// // Define the mapping from Dodo's specific product IDs to your application's simplified tiers.
// const PRODUCT_ID_TO_TIER: { [key: string]: "basic" | "pro" } = {
//   // Basic Tier IDs
//   "pdt_FCUDc6TryvYbtHPZIn13e": "basic", // Basic Monthly
//   "pdt_uTezw214Hcw1MdzNiLAOH": "basic", // Basic Yearly
//   // Pro Tier IDs
//   "pdt_BP02fccEk57LwHyJ62dFf": "pro",   // Pro Monthly
//   "pdt_97jPOb6Fwt9PGdySwTTNp": "pro",   // Pro Yearly
// };

// /**
//  * Maps a Dodo product ID to an application tier ('free', 'basic', or 'pro').
//  * Defaults to 'free' if the product ID is not found in the map.
//  */
// function getTierFromProductId(productId: string): "free" | "basic" | "pro" {
//   // Check if the product ID is recognized (basic or pro)
//   const mappedTier = PRODUCT_ID_TO_TIER[productId];

//   // If the product ID is recognized, return the mapped tier.
//   // Otherwise, default to "free" as this is the safest state for an unmapped or non-paid product ID.
//   return mappedTier || "free";
// }

// // This function correctly handles Base64URL encoding (with - and _)
// function base64UrlToUint8Array(base64Url: string) {

//   // 1. Replace Base64URL chars with standard Base64 chars
//   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

//   // 2. Add padding '=' if necessary
//   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
//   const base64Padded = base64 + padding;

//   // --- DEBUG: Check the string right before the decode attempt ---
//   console.log(`DEBUG: Base64 string length before decode: ${base64Padded.length}`);
//   // ----------------------------------------------------------------

//   try {
//     // 3. Decode using standard atob
//     const binary = atob(base64Padded);

//     // FIX: Use Uint8Array.from(string, mappingFn) instead of the loop/new Uint8Array(length).
//     // This is often more type-compatible with the Web Crypto API's strict BufferSource requirements in environments like Deno.
//     return Uint8Array.from(binary, (c) => c.charCodeAt(0));

//   } catch (e) {
//     console.error("FATAL DECODE ERROR: The padded string contains invalid Base64 characters.");
//     throw e; // Re-throw the error
//   }
// }

// // **Updated decodeSecret**
// function decodeSecret(secret: string) {
//   // 1. Log the raw secret input length
//   console.log(`DEBUG: Raw DODO_WEBHOOK_SECRET length (before whsec_ strip): ${secret.length}`);

//   // 2. Strip "whsec_" prefix if present
//   const cleaned = secret.replace(/^whsec_/, "");

//   // 3. Log the length of the string being decoded
//   console.log(`DEBUG: Base64/URL component length: ${cleaned.length}`);

//   // 4. Use the Base64URL decoder for the secret
//   return base64UrlToUint8Array(cleaned);
// }

// // **REVISED verifySvixSignature**
// // Refactored to properly parse and check all v1 signatures provided in the header.
// async function verifySvixSignature(rawBody: string, signature: string, timestamp: string, webhookId: string) {
//   const encoder = new TextEncoder();

//   // 1. Parse the signature header to extract ALL v1 signatures. 
//   // Header format: "v1,<sig1> v1,<sig2>"
//   const sigPairs = signature.split(" ").filter(p => p.startsWith("v1,"));
//   const signaturesToVerify: Uint8Array[] = [];

//   for (const pair of sigPairs) {
//     // Extract the Base64 signature after the comma
//     const sigBase64 = pair.substring(pair.indexOf(",") + 1).trim().replace(/^sig=/, "");

//     if (sigBase64) {
//       try {
//         // Decode from standard Base64
//         const signatureBytes = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
//         signaturesToVerify.push(signatureBytes);
//       } catch (e) {
//         console.error(`❌ Failed to decode signature part ("${sigBase64.substring(0, 10)}..."): ${e.message}`);
//       }
//     }
//   }

//   if (signaturesToVerify.length === 0) {
//     console.log("❌ No verifiable signatures found in header.");
//     return false;
//   }

//   // 2. Decode the secret key
//   const secretBytes = decodeSecret(DODO_WEBHOOK_SECRET ?? "");

//   // CRITICAL CHECK: Key length must be 32 bytes (256 bits)
//   if (secretBytes.length !== 32) {
//     console.warn(`⚠️ WARNING: Decoded secret key length is ${secretBytes.length} bytes. HMAC-SHA256 typically requires 32 bytes. Verification will proceed, but this is a likely cause of failure. Please check your DODO_WEBHOOK_SECRET.`);
//   } else {
//     console.log(`✅ DEBUG: Decoded Secret Key Length: ${secretBytes.length} bytes (Correct for HMAC-SHA256).`);
//   }


//   const key = await crypto.subtle.importKey(
//     "raw",
//     secretBytes,
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["verify"]
//   );

//   // 3. Define the signed payload string as specified in Dodo's documentation:
//   // webhook-id.webhook-timestamp.rawBody (separated by periods)
//   const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;

//   console.log(`DEBUG: Signed payload constructed: "${signedPayload.substring(0, 50)}..."`);

//   // 4. Verify the signature against ALL extracted signatures
//   for (const signatureBytes of signaturesToVerify) {
//     const ok = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(signedPayload));

//     if (ok) {
//       console.log(`✅ Signature matched one of the ${signaturesToVerify.length} signatures!`);
//       return true;
//     }
//   }

//   // Fallback check for the old format, just in case (e.g., if ID is optional)
//   const fallbackPayload = `${timestamp}.${rawBody}`;
//   // Since the primary loop failed, we check the fallback payload against all signatures
//   for (const signatureBytes of signaturesToVerify) {
//     const fallbackOk = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(fallbackPayload));

//     if (fallbackOk) {
//       console.log(`✅ Signature matched the fallback pattern: "${fallbackPayload.substring(0, 20)}..."`);
//       return true;
//     }
//   }

//   console.log("❌ No signature match for the specified or fallback patterns.");
//   return false;
// }


// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", {
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "POST, OPTIONS",
//         "Access-Control-Allow-Headers": "content-type, webhook-signature, webhook-timestamp, webhook-id",
//       },
//     });
//   }
//   try {
//     if (req.method !== "POST") {
//       return new Response(JSON.stringify({ error: "Method not allowed" }), {
//         status: 405,
//         headers: { "Content-Type": "application/json" },
//       });
//     }
//     console.log("🧩 Checking secret...");
//     console.log("DODO_WEBHOOK_SECRET exists:", !!DODO_WEBHOOK_SECRET);

//     const rawBody = await req.text();
//     // Dodo actually sends "webhook-signature", "webhook-timestamp", and "webhook-id"
//     const signature = req.headers.get("webhook-signature");
//     const timestamp = req.headers.get("webhook-timestamp");
//     const webhookId = req.headers.get("webhook-id"); // NEW: Get the ID header

//     console.log("🧩 Headers:", Object.fromEntries(req.headers));

//     if (!DODO_WEBHOOK_SECRET || !signature || !timestamp || !webhookId) {
//       console.error("Missing secret, signature, timestamp, or webhook-id in headers.");
//       return new Response(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Pass the new webhookId to the verification function
//     const isValid = await verifySvixSignature(rawBody, signature, timestamp, webhookId);

//     if (!isValid) {
//       console.error("Invalid signature");
//       console.log({ rawBody, signature, timestamp, webhookId });
//       return new Response(JSON.stringify({ error: "Invalid signature" }), {
//         status: 403,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const event = JSON.parse(rawBody);
//     const { type, data: Data } = event;
//     console.log("📦 Incoming Dodo event:", type);
//     console.log("🧾 Raw data:", Data);

//     const user_id = Data?.metadata?.user_id;
//     const product_id = Data?.product_id;

//     if (!user_id || !product_id) {
//       console.error("Missing user_id or product_id in event:", event);
//       return new Response(JSON.stringify({ error: "Invalid event data" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Get the simplified tier name ('free', 'basic', or 'pro'). 
//     // This is now guaranteed to be one of the three desired values.
//     const tier = getTierFromProductId(product_id);

//     // The interval logic remains the same.
//     const interval = product_id.includes("monthly") ? "monthly" : "yearly";

//     // Use the actual dates from the payload for accurate subscription tracking.
//     // The renewal/active start date should be the previous billing date or created_at.
//     const startDate = new Date(Data.previous_billing_date || Data.created_at);
//     const endDate = new Date(Data.expires_at);

//     switch (type) {
//       case "subscription.active":
//       case "subscription.renewed":
//       case "subscription.plan_changed":
//         // If the tier is 'free', we set the dates to null as it's not a timed subscription.
//         const isPaid = tier !== 'free';

//         await supabase.from("profiles").update({
//           subscription_type: tier, // Can be 'free', 'basic', or 'pro'
//           subscription_start: isPaid ? startDate.toISOString() : null,
//           subscription_end: isPaid ? endDate.toISOString() : null,
//           billing_interval: isPaid ? interval : null,
//         }).eq("id", user_id);
//         console.log(`✅ User ${user_id} subscription set to ${tier} plan (Product ID: ${product_id})`);
//         break;

//       case "subscription.cancelled":
//       case "subscription.expired":
//         await supabase.from("profiles").update({
//           subscription_type: "free", // Correctly sets to 'free' on termination
//           subscription_start: null,
//           subscription_end: null,
//           billing_interval: null,
//         }).eq("id", user_id);
//         console.log(`⚠️ User ${user_id} downgraded to free plan`);
//         break;

//       case "subscription.failed":
//       case "subscription.on_hold":
//         await supabase.from("profiles").update({
//           subscription_type: "on_hold",
//         }).eq("id", user_id);
//         console.log(`⚠️ User ${user_id} subscription on hold`);
//         break;

//       default:
//         console.log("ℹ️ Unhandled Dodo event:", type);
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("❌ Webhook error:", error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// });


// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// // import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";
// console.log("🚀 Dodo webhook deployed successfully");
// const subtle = crypto.subtle;
// const supabase = createClient(
//   Deno.env.get("SUPABASE_URL") ?? "",
//   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
// );

// // We will defensively trim the secret when retrieved
// const DODO_WEBHOOK_SECRET = Deno.env.get("DODO_WEBHOOK_SECRET")?.trim();

// // --- NEW STRUCTURE: Map now explicitly contains both tier and interval ---
// type SubscriptionDetails = {
//   tier: "free" | "basic" | "pro";
//   interval: "monthly" | "yearly" | null;
// }

// // Define the mapping from Dodo's specific product IDs to your application's simplified tiers and intervals.
// const PRODUCT_ID_TO_DETAILS: { [key: string]: { tier: "basic" | "pro", interval: "monthly" | "yearly" } } = {
//   // Basic Tier IDs
//   "pdt_FCUDc6TryvYbtHPZIn13e": { tier: "basic", interval: "monthly" }, // Basic Monthly
//   "pdt_uTezw214Hcw1MdzNiLAOH": { tier: "basic", interval: "yearly" },  // Basic Yearly
//   // Pro Tier IDs
//   "pdt_BP02fccEk57LwHyJ62dFf": { tier: "pro", interval: "monthly" },   // Pro Monthly
//   "pdt_97jPOb6Fwt9PGdySwTTNp": { tier: "pro", interval: "yearly" },    // Pro Yearly
// };
// // ------------------------------------------------------------------------

// /**
//  * Maps a Dodo product ID to the application's subscription details.
//  * Defaults to 'free' tier with null interval if the product ID is not found.
//  */
// function getSubscriptionDetailsFromProductId(productId: string): SubscriptionDetails {
//   // Check if the product ID is recognized (basic or pro)
//   const mappedDetails = PRODUCT_ID_TO_DETAILS[productId];

//   // If details are found, return them.
//   if (mappedDetails) {
//     return mappedDetails;
//   }

//   // Otherwise, default to "free" with null interval.
//   return { tier: "free", interval: null };
// }

// // This function correctly handles Base64URL encoding (with - and _)
// function base64UrlToUint8Array(base64Url: string) {

//   // 1. Replace Base64URL chars with standard Base64 chars
//   const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

//   // 2. Add padding '=' if necessary
//   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
//   const base64Padded = base64 + padding;

//   // --- DEBUG: Check the string right before the decode attempt ---
//   console.log(`DEBUG: Base64 string length before decode: ${base64Padded.length}`);
//   // ----------------------------------------------------------------

//   try {
//     // 3. Decode using standard atob
//     const binary = atob(base64Padded);

//     // FIX: Use Uint8Array.from(string, mappingFn) instead of the loop/new Uint8Array(length).
//     // This is often more type-compatible with the Web Crypto API's strict BufferSource requirements in environments like Deno.
//     return Uint8Array.from(binary, (c) => c.charCodeAt(0));

//   } catch (e) {
//     console.error("FATAL DECODE ERROR: The padded string contains invalid Base64 characters.");
//     throw e; // Re-throw the error
//   }
// }

// // **Updated decodeSecret**
// function decodeSecret(secret: string) {
//   // 1. Log the raw secret input length
//   console.log(`DEBUG: Raw DODO_WEBHOOK_SECRET length (before whsec_ strip): ${secret.length}`);

//   // 2. Strip "whsec_" prefix if present
//   const cleaned = secret.replace(/^whsec_/, "");

//   // 3. Log the length of the string being decoded
//   console.log(`DEBUG: Base64/URL component length: ${cleaned.length}`);

//   // 4. Use the Base64URL decoder for the secret
//   return base64UrlToUint8Array(cleaned);
// }

// // **REVISED verifySvixSignature**
// // Refactored to properly parse and check all v1 signatures provided in the header.
// async function verifySvixSignature(rawBody: string, signature: string, timestamp: string, webhookId: string) {
//   const encoder = new TextEncoder();

//   // 1. Parse the signature header to extract ALL v1 signatures. 
//   // Header format: "v1,<sig1> v1,<sig2>"
//   const sigPairs = signature.split(" ").filter(p => p.startsWith("v1,"));
//   const signaturesToVerify: Uint8Array[] = [];

//   for (const pair of sigPairs) {
//     // Extract the Base64 signature after the comma
//     const sigBase64 = pair.substring(pair.indexOf(",") + 1).trim().replace(/^sig=/, "");

//     if (sigBase64) {
//       try {
//         // Decode from standard Base64
//         const signatureBytes = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
//         signaturesToVerify.push(signatureBytes);
//       } catch (e) {
//         console.error(`❌ Failed to decode signature part ("${sigBase64.substring(0, 10)}..."): ${e.message}`);
//       }
//     }
//   }

//   if (signaturesToVerify.length === 0) {
//     console.log("❌ No verifiable signatures found in header.");
//     return false;
//   }

//   // 2. Decode the secret key
//   const secretBytes = decodeSecret(DODO_WEBHOOK_SECRET ?? "");

//   // CRITICAL CHECK: Key length must be 32 bytes (256 bits)
//   if (secretBytes.length !== 32) {
//     console.warn(`⚠️ WARNING: Decoded secret key length is ${secretBytes.length} bytes. HMAC-SHA256 typically requires 32 bytes. Verification will proceed, but this is a likely cause of failure. Please check your DODO_WEBHOOK_SECRET.`);
//   } else {
//     console.log(`✅ DEBUG: Decoded Secret Key Length: ${secretBytes.length} bytes (Correct for HMAC-SHA256).`);
//   }


//   const key = await crypto.subtle.importKey(
//     "raw",
//     secretBytes,
//     { name: "HMAC", hash: "SHA-256" },
//     false,
//     ["verify"]
//   );

//   // 3. Define the signed payload string as specified in Dodo's documentation:
//   // webhook-id.webhook-timestamp.rawBody (separated by periods)
//   const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;

//   console.log(`DEBUG: Signed payload constructed: "${signedPayload.substring(0, 50)}..."`);

//   // 4. Verify the signature against ALL extracted signatures
//   for (const signatureBytes of signaturesToVerify) {
//     const ok = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(signedPayload));

//     if (ok) {
//       console.log(`✅ Signature matched one of the ${signaturesToVerify.length} signatures!`);
//       return true;
//     }
//   }

//   // Fallback check for the old format, just in case (e.g., if ID is optional)
//   const fallbackPayload = `${timestamp}.${rawBody}`;
//   // Since the primary loop failed, we check the fallback payload against all signatures
//   for (const signatureBytes of signaturesToVerify) {
//     const fallbackOk = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(fallbackPayload));

//     if (fallbackOk) {
//       console.log(`✅ Signature matched the fallback pattern: "${fallbackPayload.substring(0, 20)}..."`);
//       return true;
//     }
//   }

//   console.log("❌ No signature match for the specified or fallback patterns.");
//   return false;
// }


// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", {
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "POST, OPTIONS",
//         "Access-Control-Allow-Headers": "content-type, webhook-signature, webhook-timestamp, webhook-id",
//       },
//     });
//   }
//   try {
//     if (req.method !== "POST") {
//       return new Response(JSON.stringify({ error: "Method not allowed" }), {
//         status: 405,
//         headers: { "Content-Type": "application/json" },
//       });
//     }
//     console.log("🧩 Checking secret...");
//     console.log("DODO_WEBHOOK_SECRET exists:", !!DODO_WEBHOOK_SECRET);

//     const rawBody = await req.text();
//     // Dodo actually sends "webhook-signature", "webhook-timestamp", and "webhook-id"
//     const signature = req.headers.get("webhook-signature");
//     const timestamp = req.headers.get("webhook-timestamp");
//     const webhookId = req.headers.get("webhook-id"); // NEW: Get the ID header

//     console.log("🧩 Headers:", Object.fromEntries(req.headers));

//     if (!DODO_WEBHOOK_SECRET || !signature || !timestamp || !webhookId) {
//       console.error("Missing secret, signature, timestamp, or webhook-id in headers.");
//       return new Response(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Pass the new webhookId to the verification function
//     const isValid = await verifySvixSignature(rawBody, signature, timestamp, webhookId);

//     if (!isValid) {
//       console.error("Invalid signature");
//       console.log({ rawBody, signature, timestamp, webhookId });
//       return new Response(JSON.stringify({ error: "Invalid signature" }), {
//         status: 403,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const event = JSON.parse(rawBody);
//     const { type, data: Data } = event;
//     console.log("📦 Incoming Dodo event:", type);
//     console.log("🧾 Raw data:", Data);

//     const user_id = Data?.metadata?.user_id;
//     const product_id = Data?.product_id;

//     if (!user_id || !product_id) {
//       console.error("Missing user_id or product_id in event:", event);
//       return new Response(JSON.stringify({ error: "Invalid event data" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // --- Get subscription details (tier and interval) ---
//     const subscriptionDetails = getSubscriptionDetailsFromProductId(product_id);
//     const { tier, interval } = subscriptionDetails;

//     // 1. Start Date: Use previous_billing_date for the most accurate cycle start.
//     // If previous_billing_date is null (e.g., initial subscription event), fall back to created_at.
//     const startDate = Data.previous_billing_date
//       ? new Date(Data.previous_billing_date)
//       : new Date(Data.created_at);

//     let finalEndDate: Date | null = null;
//     const fiveYearsFromNow = new Date();
//     fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

//     // Logic for finalEndDate (which maps to subscription_end in Supabase)
//     // Priority 1: Cancellation date (expires_at) if cancellation is scheduled AND not a placeholder
//     if (Data.cancel_at_next_billing_date === true && Data.expires_at) {
//       const candidateDate = new Date(Data.expires_at);
//       if (candidateDate <= fiveYearsFromNow) {
//         console.log(`✅ User has scheduled cancellation. Setting subscription_end to expires_at: ${candidateDate.toISOString()}`);
//         finalEndDate = candidateDate;
//       } else {
//         console.warn(`⚠️ Cancellation scheduled, but expires_at is distant placeholder. Setting subscription_end to null.`);
//         finalEndDate = null;
//       }
//     }
//     // Priority 2: Next billing date for active, auto-renewing plans
//     else if (Data.next_billing_date) {
//       const candidateDate = new Date(Data.next_billing_date);
//       console.log(`💰 Setting subscription_end to next_billing_date: ${candidateDate.toISOString()}`);
//       finalEndDate = candidateDate;
//     }
//     // If neither is present (e.g., on some 'free' or unhandled events), it remains null.

//     // -------------------------------------------------------------------------

//     switch (type) {
//       case "subscription.active":
//       case "subscription.renewed":
//       case "subscription.plan_changed":
//         // If the tier is 'free', we set the dates to null as it's not a timed subscription.
//         const isPaid = tier !== 'free';

//         const { error: activeUpdateError } = await supabase.from("profiles").update({
//           subscription_type: tier, // Can be 'free', 'basic', or 'pro'
//           subscription_start: isPaid ? startDate.toISOString() : null,
//           // Use the date determined by the logic above (either next_billing_date or expires_at)
//           subscription_end: finalEndDate ? finalEndDate.toISOString() : null,
//           billing_interval: isPaid ? interval : null,
//         }).eq("id", user_id);

//         if (activeUpdateError) {
//           console.error(`❌ SUPABASE UPDATE FAILED for user ${user_id} during ACTIVE/RENEW/CHANGE:`, activeUpdateError);
//         } else {
//           console.log(`✅ User ${user_id} subscription set to ${tier} plan (Product ID: ${product_id})`);
//         }
//         break;

//       case "subscription.cancelled":
//       case "subscription.expired":
//         const { error: cancelledUpdateError } = await supabase.from("profiles").update({
//           subscription_type: "free", // Correctly sets to 'free' on termination
//           subscription_start: null,
//           subscription_end: null,
//           billing_interval: null,
//         }).eq("id", user_id);

//         if (cancelledUpdateError) {
//           console.error(`❌ SUPABASE UPDATE FAILED for user ${user_id} during CANCELLED/EXPIRED:`, cancelledUpdateError);
//         } else {
//           console.log(`⚠️ User ${user_id} downgraded to free plan`);
//         }
//         break;

//       case "subscription.failed":
//       case "subscription.on_hold":
//         const { error: onHoldUpdateError } = await supabase.from("profiles").update({
//           subscription_type: "on_hold",
//           // We intentionally keep existing dates or null them out as needed for 'on_hold'
//         }).eq("id", user_id);

//         if (onHoldUpdateError) {
//           console.error(`❌ SUPABASE UPDATE FAILED for user ${user_id} during FAILED/ON_HOLD:`, onHoldUpdateError);
//         } else {
//           console.log(`⚠️ User ${user_id} subscription on hold`);
//         }
//         break;

//       default:
//         console.log("ℹ️ Unhandled Dodo event:", type);
//     }

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("❌ Webhook error:", error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// });


import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
// Use the official DodoPayments SDK for secure verification
import { DodoPayments, WebhookEvent } from 'https://esm.sh/dodopayments@2.4.1';

// --- Configuration ---
// Define the mapping from Dodo's specific product IDs to your application's simplified tiers and intervals.
const PRODUCT_ID_TO_DETAILS: { [key: string]: { tier: "basic" | "pro", interval: "monthly" | "yearly" } } = {
    "pdt_FCUDc6TryvYbtHPZIn13e": { tier: "basic", interval: "monthly" }, // Basic Monthly
    "pdt_uTezw214Hcw1MdzNiLAOH": { tier: "basic", interval: "yearly" },  // Basic Yearly
    "pdt_BP02fccEk57LwHyJ62dFf": { tier: "pro", interval: "monthly" },   // Pro Monthly
    "pdt_97jPOb6Fwt9PGdySwTTNp": { tier: "pro", interval: "yearly" },    // Pro Yearly
};

type SubscriptionDetails = {
    tier: "free" | "basic" | "pro";
    interval: "monthly" | "yearly" | null;
}

function getSubscriptionDetailsFromProductId(productId: string): SubscriptionDetails {
    const mappedDetails = PRODUCT_ID_TO_DETAILS[productId];
    if (mappedDetails) {
        return mappedDetails;
    }
    return { tier: "free", interval: null };
}

// --- CORS Configuration ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- Main Serverless Function ---
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const apiKey = Deno.env.get('DODO_API_KEY');
        const webhookKey = Deno.env.get('DODO_WEBHOOK_SECRET');

        if (!supabaseUrl || !supabaseServiceKey || !apiKey || !webhookKey) {
            console.error('❌ Missing required environment variables (Supabase or Dodo keys)');
            throw new Error('Server configuration error');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const rawBody = await req.text();
        console.log('📨 Webhook received');

        // --- 1. SDK Verification and Unwrapping ---
        let payload: WebhookEvent;
        const webhookHeaders = {
            'webhook-id': req.headers.get('webhook-id') || '',
            'webhook-signature': req.headers.get('webhook-signature') || '',
            'webhook-timestamp': req.headers.get('webhook-timestamp') || '',
        };

        try {
            const dodoPaymentsClient = new DodoPayments({
                bearerToken: apiKey,
                webhookKey: webhookKey,
            });
            payload = dodoPaymentsClient.webhooks.unwrap(rawBody, { headers: webhookHeaders });
            console.log('✅ Webhook signature verified and unwrapped');
        } catch (error) {
            console.error('❌ Webhook verification failed:', error);
            return new Response(
                JSON.stringify({ error: 'Webhook verification failed' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const eventType = payload.type;
        const eventData = payload.data;

        // --- 2. Process Event and Update Profiles Table ---
        try {
            console.log(`🔄 Processing: ${eventType}`);

            switch (eventType) {
                case 'subscription.active':
                case 'subscription.renewed':
                case 'subscription.plan_changed':
                    await handleSubscriptionEvent(supabase, eventData, 'active');
                    break;

                case 'subscription.cancelled':
                case 'subscription.expired':
                    await handleSubscriptionEvent(supabase, eventData, 'cancelled');
                    break;

                case 'subscription.failed':
                case 'subscription.on_hold':
                    await handleSubscriptionEvent(supabase, eventData, 'on_hold');
                    break;

                default:
                    console.log(`ℹ️ Event ${eventType} received but no action required.`);
            }

            console.log('✅ Webhook processed successfully');

            return new Response(
                JSON.stringify({ success: true, event_type: eventType }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (processingError) {
            console.error('❌ Error processing webhook event:', processingError);
            return new Response(
                JSON.stringify({ error: 'Webhook processing failed', details: processingError instanceof Error ? processingError.message : 'Unknown error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

    } catch (error) {
        console.error('❌ Fatal Deno error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

/**
 * Handles the database updates for all subscription-related events by updating the 'profiles' table.
 */
async function handleSubscriptionEvent(supabase: SupabaseClient, data: any, status: string) {
    const userId = data.metadata?.user_id;
    const productId = data.product_id;

    if (!userId) {
        // This should not happen if the user ID is passed in Dodo metadata
        throw new Error(`Missing required user_id in event metadata.`);
    }

    const subscriptionDetails = getSubscriptionDetailsFromProductId(productId);
    const { tier, interval } = subscriptionDetails;

    // Determine the subscription status for the 'profiles' table based on the webhook event status
    let newSubscriptionType: string;
    let isPaid = false;

    if (status === 'cancelled' || status === 'expired') {
        newSubscriptionType = "free";
    } else if (status === 'on_hold') {
        newSubscriptionType = "on_hold";
    } else if (status === 'active') {
        newSubscriptionType = tier; // basic or pro
        isPaid = true;
    } else {
        newSubscriptionType = "free"; // Default fallback
    }

    // --- Date Calculation Logic (subscription_start & subscription_end) ---

    // 1. Subscription Start Date
    // Use previous_billing_date for the most accurate cycle start, fall back to created_at
    const startDate = data.previous_billing_date
        ? new Date(data.previous_billing_date)
        : new Date(data.created_at);

    // 2. Subscription End Date
    let finalEndDate: Date | null = null;
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);


    if (status === 'cancelled' || status === 'expired') {
        // For cancellation, we often use the next_billing_date/expires_at if the user paid for that term
        // If expires_at is available, use it to denote when access actually ends
        if (data.expires_at) {
             const candidateDate = new Date(data.expires_at);
             if (candidateDate <= fiveYearsFromNow) {
                 finalEndDate = candidateDate;
             }
        }
    }
    // Logic for active subscriptions (set end date to next expected renewal)
    else if (status === 'active' && data.next_billing_date) {
        finalEndDate = new Date(data.next_billing_date);
    }


    // --- Update Profiles Table ---
    const { error: profilesUpdateError } = await supabase.from("profiles").update({
        subscription_type: newSubscriptionType,
        subscription_start: isPaid ? startDate.toISOString() : null,
        subscription_end: finalEndDate ? finalEndDate.toISOString() : null,
        billing_interval: isPaid ? interval : null,
    }).eq("id", userId);

    if (profilesUpdateError) {
        throw new Error(`Failed to update profiles table for user ${userId}: ${profilesUpdateError.message}`);
    }

    console.log(`✅ User ${userId} profile updated to: ${newSubscriptionType} (Interval: ${isPaid ? interval : 'N/A'})`);
}
