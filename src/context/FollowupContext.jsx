import { createContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

export const FollowUpContext = createContext();

export function FollowUpProvider({ children }) {
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Fetch follow-ups for a specific output
    async function fetchFollowUps(outputId) {
        if (!outputId) return;

        setLoading(true);
        if (!user) {
            toast.error("Please login first!");
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("followups")
            .select("*")
            .eq("user_id", user.id)
            .eq("output_id", outputId)
            .order("created_at", { ascending: true }); // ascending to show conversation order

        if (!error) {
            setFollowUps(data || []);
        } else {
            toast.error("Something went wrong while fetching follow-ups!");
        }
        setLoading(false);
    }

    // Save a follow-up message
    async function saveFollowUp(outputId, role, content) {
        if (!content || !outputId) return;

        if (!user) {
            toast.error("Please login first!");
            return;
        }

        const { data, error } = await supabase
            .from("followups")
            .insert([{ output_id: outputId, user_id: user.id, role, content }])
            .select()
            .single();

        if (!error) {
            setFollowUps(prev => [...prev, data]);
        } else {
            toast.error("Failed to save follow-up.");
            console.error(error);
        }
    }
    return (
        <FollowUpContext.Provider value={{ followUps, setFollowUps, loading, fetchFollowUps, saveFollowUp }}>
            {children}
        </FollowUpContext.Provider>
    );
}
