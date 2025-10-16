// import { createContext, useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// export const AuthContext = createContext();
// export const AuthProvider = ({ children }) => {
//     const [session, setSession] = useState(null);
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [profile, setProfile] = useState(null);
//     const [usage, setUsage] = useState(null);
//     const nav = useNavigate();
//     const fetchProfile = async (uid) => {
//         const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
//         if (error) {
//             console.log(error);
//             return;
//         }
//         return data;
//     }

//     const getUsage = async (uid) => {
//         const { data, error } = await supabase.from("usage").select("*").eq("user_id", uid).maybeSingle();
//         if (error) {
//             console.log(error);
//             return;
//         }
//         return data;
//     }
//     const refreshProfile = async () => {
//         if (!user) return;
//         const prof = await fetchProfile(user.id);
//         const limit = await getUsage(user.id);
//         setProfile(prof);
//         setUsage(limit);
//         return { prof, limit };
//     };
//     useEffect(() => {
//         const getSession = async () => {
//             const { data, error } = await supabase.auth.getSession();
//             if (error) console.log(error);
//             setSession(data.session);
//             setUser(data?.session?.user || null);
//             setLoading(false);
//             if (data?.session?.user) {
//                 await refreshProfile(); // also load profile + usage on page refresh
//             }
//         }
//         getSession();
//         const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
//             setSession(session);
//             setUser(session?.user || null);

//             setLoading(false); // set loading first to avoid UI flicker

//             if (event === "SIGNED_IN" && session?.user) {
//                 fetchProfile(session.user.id).then(prof => setProfile(prof));
//                 getUsage(session.user.id).then(limit => setUsage(limit));
//                 // const prof = await fetchProfile(session.user.id);
//                 // setProfile(prof);
//                 await refreshProfile();
//                 if (!sessionStorage.getItem("welcomeShown")) {
//                     toast.success("Welcome back! You’re now logged in.");
//                     sessionStorage.setItem("welcomeShown", "true");
//                 }
//                 nav("/app")
//             }

//             if (event === "SIGNED_OUT") {
//                 setUser(null);
//                 setProfile(null);
//                 setSession(null);
//                 toast.info("You have been logged out.");
//                 nav("/");
//             }


//             setLoading(false);
//         });

//         return () => {
//             listener.subscription.unsubscribe();
//         }
//     }, [])
//     const signout = async () => {
//         const { data } = await supabase.auth.getSession();
//         if (!data.session) {
//             toast.info("Please login first");
//             return;
//         }
//         await supabase.auth.signOut();
//     }

//     const signInWithProvider = async (provider) => {
//         const { error } = await supabase.auth.signInWithOAuth({ provider });
//         if (error) toast.error("Login failed!")
//     }
//     return (
//         <AuthContext.Provider value={{ user, session, profile, fetchProfile, refreshProfile, usage, setUsage, loading, signout, signInWithProvider }}>
//             {children}
//         </AuthContext.Provider>
//     )
// }




import { createContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    // Fetch profile from DB
    const fetchProfile = async (uid) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", uid)
            .single();
        if (error) {
            console.error(error);
            return null;
        }
        return data;
    };

    // Fetch usage from DB
    const getUsage = async (uid) => {
        const { data, error } = await supabase
            .from("usage")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle();
        if (error) {
            console.error(error);
            return null;
        }
        return data;
    };

    // Refresh profile and usage
    const refreshProfile = async () => {
        if (!user) return;
        const prof = await fetchProfile(user.id);
        const limit = await getUsage(user.id);
        setProfile(prof);
        setUsage(limit);
        return { prof, limit };
    };

    // Initialize session on page load
    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);

            const { data, error } = await supabase.auth.getSession();
            if (error) console.error(error);

            setSession(data.session);
            setUser(data.session?.user || null);

            if (data.session?.user) {
                await refreshProfile();

                // Only redirect if user is on landing pages
                const landingPaths = ["/", "/login", "/waitlist"];
                if (landingPaths.includes(window.location.pathname)) {
                    nav("/app");
                }
            }

            setLoading(false);
        };

        initAuth();

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);

                if (session?.user) {
                    setUser(session.user);
                    await refreshProfile();

                    if (event === "SIGNED_IN") {
                        // Only redirect if user is on landing pages
                        const landingPaths = ["/", "/login", "/waitlist"];
                        if (landingPaths.includes(window.location.pathname)) {
                            nav("/app");
                        }

                        if (!sessionStorage.getItem("welcomeShown")) {
                            toast.success("Welcome back! You’re now logged in.");
                            sessionStorage.setItem("welcomeShown", "true");
                        }
                    }

                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setProfile(null);
                    setUsage(null);
                    setSession(null);
                    toast.info("You have been logged out.");
                    nav("/");
                }

                setLoading(false);
            }
        );

        return () => listener.subscription.unsubscribe();
    }, []);


    // OAuth login
    const signInWithProvider = async (provider) => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin, // ensures proper redirect after login
            },
        });
        if (error) toast.error("Login failed!");
    };

    const signout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Logout failed!")
            console.log(error);

        };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                usage,
                setUsage,
                loading,
                fetchProfile,
                refreshProfile,
                signInWithProvider,
                signout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
