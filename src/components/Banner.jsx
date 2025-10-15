import pako from "pako";
import { useRef, useState } from "react"
import { useGeminiContext } from "../context/useGeminiContext";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
import { useInput } from "../context/useInput";
import { useOutput } from "../context/useOutput";
import { useAuth } from "../context/useAuth";
import { GoogleGenAI } from "@google/genai";

const Banner = () => {
  const [isPasteLinkSelected, setIsPasteLinkSelected] = useState(true);
  const { generateSummary, apiText, setApiText, apiLink, setApiLink } = useGeminiContext();
  const { setInputs, fetchInputs } = useInput();
  const { setOutputs, setCurrentOutputId } = useOutput();
  const today = new Date().toISOString().split('T')[0];
  const apiLinkRef = useRef();
  const apiTextRef = useRef();
  const { user, session, usage, setUsage, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const limits = {
    free: { simplify: 10, followup: 5 },
    basic: { simplify: 100, followup: 50 },
    pro: { simplify: Infinity, followup: Infinity },
  }
  const userPlan = profile?.subscription_type || "free";
  const currentLimit = limits[userPlan];
  const simplifiedCount = usage?.simplify_count || 0;

  const saveInput = async () => {
    if (!user) {
      toast.error("Please Login First!")
      return;
    }
    const newInput = {
      user_id: user.id,
      api_link: apiLink || null,
      api_text: apiText || null,
      created_at: today
    }
    const { data, error } = await supabase.from("inputs").insert([newInput]).select().single();
    if (!error) {
      setInputs((prev) => [data, ...prev]);
    } else {
      toast.error("Something went wrong. Please try again later!");
    }
    return data;
  }
  const handleSimplifyDocs = async () => {
    const token = session?.access_token;
    console.log("Working");
    let summary;
    setLoading(true);
    setStatus("idle");
    try {
      if (!apiLink && !apiText) {
        toast.error("Please paste a Doc link or text");
        setLoading(false);
        return;
      }
      if (simplifiedCount >= currentLimit?.simplify) {
        toast.error("You’ve reached your simplify limit!");
        setLoading(false);
        return;
      }
      const inputRow = await saveInput();
      if (!inputRow) {
        setLoading(false);
        return;
      }
      await fetchInputs();

      if (!user || !session) {
        toast.error("You must be logged in to simplify documentation.");
        setLoading(false);
        return;
      }

      if (apiLink) {
        try {
          new URL(apiLink); // Throws if invalid
        } catch {
          toast.error("Please enter a valid URL!");
          setStatus("idle");
          return;
        }
        setStatus("fetching");
        // 1️⃣ Call Edge Function with user_id and actionType
        console.log(apiLink);

        console.log("Calling edge function with:", { url: apiLink, userId: user.id });
        const response = await fetch(
          "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/simplifyDoc",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              url: apiLink,
              user_id: user.id,       // Pass user ID for usage tracking
            }),
          }
        );
        console.log("Edge function response status:", response.status);
        if (!response.ok) {
          let errorResp;
          try {
            errorResp = await response.json();
          } catch {
            errorResp = { message: "Something went wrong while simplifying!" };
          }
          toast.error(errorResp?.message || "Something went wrong while simplifying!");
          console.log(errorResp);
          setStatus("idle");
          return;
        }


        setStatus("summarizing");
        console.log(response);

        const resp = await response.json();
        console.log(resp);

        const simplifiedText = resp.content;
        summary = await generateSummary({ apiText: simplifiedText });
        console.log(summary);
        setStatus("done");
      } else {
        setStatus("summarizing");
        summary = await generateSummary({ apiText: apiText });
        console.log(summary);
        setStatus("done");
      }
      if (!summary) {
        toast.error("Failed to generate summary. Please try again.");
        return;
      }
      // 2️⃣ Save the output in your DB
      const { data, error } = await supabase
        .from("outputs")
        .insert([
          {
            input_id: inputRow.id,
            user_id: user.id,
            simplified_text: summary,
          },
        ])
        .select()
        .single();

      if (error) {
        console.log(error);
        toast.error("Something went wrong while saving output!");
        return;
      }
      setOutputs((prev) => [data, ...prev]);
      setCurrentOutputId(data.id);
      console.log("Working");

      const trackResp = await fetch(
        "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/trackUsage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, },
          body: JSON.stringify({
            user_id: user.id,
            action: "simplify"
          }),
        }
      );

      if (!trackResp.ok) {
        const trackErr = await trackResp.json();
        console.warn("Failed to track usage:", trackErr?.error);
      }
      const result = await trackResp.json();
      if (result.ok) {
        setUsage(result.usage); // 🔥 update navbar usage instantly
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred!");
    } finally {

      setLoading(false);
      setApiLink("");
      setApiText("");
    }
  };

  // const handleSimplifyDocs = async () => {
  //   const token = session?.access_token;
  //   setLoading(true);
  //   let summary;

  //   try {
  //     if (!apiLink && !apiText) {
  //       toast.error("Please paste a Doc link or text");
  //       setLoading(false);
  //       return;
  //     }

  //     if (simplifiedCount >= currentLimit?.simplify) {
  //       toast.error("You’ve reached your simplify limit!");
  //       setLoading(false);
  //       return;
  //     }

  //     const inputRow = await saveInput();
  //     if (!inputRow) {
  //       setLoading(false);
  //       return;
  //     }
  //     await fetchInputs();

  //     if (!user || !session) {
  //       toast.error("You must be logged in to simplify documentation.");
  //       setLoading(false);
  //       return;
  //     }

  //     // Prepare input (either link or text)
  //     const input = apiLink || apiText;

  //     // --- Call unified Edge Function ---
  //     const response = await fetch(
  //       "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/simplifyDoc",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({
  //           input,        // Unified field
  //           user_id: user.id, // Optional: track usage inside the Edge Function
  //         }),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorResp = await response.json();
  //       console.log(errorResp);

  //       toast.error(errorResp?.error || "Something went wrong while simplifying!");
  //       return;
  //     }
  //     const respJson = await response.json();
  //     console.log(respJson);

  //     summary = respJson.summary;
  //     console.log(summary);

  //     if (!summary) {
  //       toast.error("Failed to generate summary. Please try again.");
  //       return;
  //     }

  //     // --- Save the output in DB ---
  //     const { data, error } = await supabase
  //       .from("outputs")
  //       .insert([
  //         {
  //           input_id: inputRow.id,
  //           user_id: user.id,
  //           simplified_text: summary,
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (error) {
  //       console.log(error);
  //       toast.error("Something went wrong while saving output!");
  //       return;
  //     }

  //     setOutputs((prev) => [data, ...prev]);
  //     setCurrentOutputId(data.id);

  //     // --- Track usage ---
  //     const trackResp = await fetch(
  //       "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/trackUsage",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "Authorization": `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({
  //           user_id: user.id,
  //           action: "simplify",
  //         }),
  //       }
  //     );

  //     if (trackResp.ok) {
  //       const result = await trackResp.json();
  //       setUsage(result.usage);
  //     }

  //   } catch (err) {
  //     console.error(err);
  //     console.log(err);

  //     toast.error("An unexpected error occurred!");
  //   } finally {
  //     setLoading(false);
  //     setApiLink("");
  //     setApiText("");
  //   }
  // };

  return (
    <main className="flex flex-col justify-center items-center gap-10 w-full">
      <section className="flex flex-col justify-center items-center">
        <h1 className="text-3xl md:text-6xl font-bold text-gray-800 dark:text-white text-center md:leading-16">
          Simplify Any API  Documentation <br /> in Seconds
        </h1>
        <p className="mt-3 text-md md:text-lg text-gray-400 dark:text-gray-300 text-center">
          Paste your docs or share a link, and let AI make it crystal clear.
        </p>
      </section>
      <div className="relative p-1 flex border border-gray-200 w-fit bg-white rounded-4xl">
        <div className="absolute top-1 bottom-1 left-1 bg-indigo-100 transition-all duration-300 ease-in-out rounded-4xl"
          style={{
            width: "calc(50% - 4px)",
            transform: isPasteLinkSelected ? "translateX(0)" : "translateX(100%)"
          }}
        ></div>
        <button className={`cursor-pointer relative z-10 px-4 md:px-6 py-2 rounded-4xl text-xs sm:text-lg ${isPasteLinkSelected ? "text-indigo-600" : "text-gray-600"}`}
          onClick={() => setIsPasteLinkSelected(true)}>Paste Docs Link</button>
        <button className={`cursor-pointer relative z-10 px-4 md:px-6 py-2 rounded-4xl text-xs sm:text-lg ${!isPasteLinkSelected ? "text-indigo-600" : "text-gray-600"}`}
          onClick={() => setIsPasteLinkSelected(false)}>Paste Docs Text</button>
      </div>
      <section className="flex flex-col gap-5 w-full sm:w-3/4 items-center transition-transform duration-300 ease-in-out">
        {isPasteLinkSelected && (
          <div className="border border-gray-400 w-full xl:w-2/3 py-2 px-4 rounded-xl flex items-center">
            <input type="text" placeholder="Enter a Docs Link" ref={apiLinkRef}
              className="outline-none w-full" value={apiLink} onChange={(e) => setApiLink(e.target.value)} />
            <X onClick={() => {
              setApiLink("");
              apiLinkRef.current.focus();
            }} size={20} className={`cursor-pointer ${apiLink.length > 0 ? "opacity-100" : "opacity-0"}`} />
          </div>
        )}
        {!isPasteLinkSelected && (
          <div className="border border-gray-400 w-full xl:w-2/3  py-2 px-4 rounded-xl flex">
            <textarea rows={`${apiText.length > 500 ? 10 : 6}`} ref={apiTextRef}
              placeholder="Enter a Docs text" className="outline-none w-full" value={apiText} onChange={(e) => setApiText(e.target.value)}></textarea>
            <X onClick={() => {
              setApiText("");
              apiTextRef.current.focus();
            }} className={`cursor-pointer ${apiText.length > 0 ? "opacity-100" : "opacity-0"}`} size={20} />
          </div>
        )}
        <button
          disabled={
            status === "fetching" ||
            status === "summarizing" ||
            simplifiedCount >= currentLimit?.simplify
          }
          className={`font-semibold px-6 py-2 rounded-2xl justify-end transition-all
              ${status === "fetching" ||
              status === "summarizing" ||
              simplifiedCount >= currentLimit?.simplify
              ? "bg-blue-900 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            }`}
          onClick={handleSimplifyDocs}
        >
          {simplifiedCount >= currentLimit?.simplify
            ? "Limit Reached"
            : status === "fetching"
              ? "Fetching Content..."
              : status === "summarizing"
                ? "Generating Summary..."
                : "Simplify Docs"}
        </button>

      </section>

    </main>
  )
}
export default Banner