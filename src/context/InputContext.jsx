import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
import { useAuth } from "./useAuth";

export const InputContext = createContext();
export function InputProvider({ children }) {
    const [inputs, setInputs] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const fetchInputs = async () => {
        setLoading(true);
        if (!user) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.from("inputs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!error) {
            setInputs(data || []);
        } else {
            toast.error("Something went wrong. Please try again later!")
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!user) return;
        fetchInputs();
    }, [user]);


    return (
        <InputContext.Provider value={{ inputs, setInputs, loading, fetchInputs }}>
            {children}
        </InputContext.Provider>
    )
}