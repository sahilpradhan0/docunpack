import { createContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth";

export const OutputContext = createContext();
export function OutputProvider({ children }) {
    const [outputs, setOutputs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentOutputId, setCurrentOutputId] = useState(null);
    const { user } = useAuth();
    async function fetchOutput() {
        setLoading(true);
        if (!user) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.from("outputs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!error) {
            setOutputs(data || []);
            if (data?.length) setCurrentOutputId(data[0].id);
        } else {
            toast.error("Something went wrong. Please try again later!")
        }
        setLoading(false);
    }
    useEffect(() => {
        if (user) {
            fetchOutput();
        }
    }, [user]);

    return (
        <OutputContext.Provider value={{ outputs, setOutputs, setCurrentOutputId, loading, currentOutputId }}>
            {children}
        </OutputContext.Provider>
    )
}