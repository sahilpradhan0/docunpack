import { GoogleGenAI } from "@google/genai";
import { createContext, useState } from "react";
import { supabase } from "../supabaseClient";

export const GeminiContext = createContext();
export function GeminiProvider({ children }) {
    const [data, setData] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiText, setApiText] = useState("");
    const [apiLink, setApiLink] = useState("");
    const generateSummary = async ({ apiText, apiLink }) => {
        if (!apiText && !apiLink) {
            setError("No input provided");
            return;
        }
        setLoading(true);
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        try {
            const res = await fetch("https://uhkbyfmvgnsbeltanizg.functions.supabase.co/generateSummary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ apiText, apiLink })
            })
            const json = await res.json();
            console.log(json);

            if (json.error) {
                setError(json.error);
                setData("");
                console.log(json.error);
                
            } else {
                setData(json.summary);
            }
            return json.summary;
        } catch (err) {
            setError("Failed to generate summary");
            console.log(err);

            setData("");
            console.error(err);

        } finally {
            setLoading(false);
        }
    }
    return (
        <GeminiContext.Provider value={{ data, loading, error, generateSummary, apiText, setApiText, apiLink, setApiLink }}>
            {children}
        </GeminiContext.Provider>
    )
}