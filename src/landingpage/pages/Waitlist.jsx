// src/pages/WaitlistPage.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";

export default function Waitlist() {
    const [email, setEmail] = useState("");
    const [planType, setPlanType] = useState("Basic"); // default value if you want
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        try {
            const response = await fetch("https://api.convertkit.com/v3/forms/8595333/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    api_key: import.meta.env.VITE_KIT_API_KEY,
                    email: email,
                    fields: { plantype: planType },
                    tags: [11001934],
                }),
            });


            const data = await response.json();
            console.log(data);

            if (response.ok) {
                setStatus("success");
                setEmail("");
                toast.success("🎉 You're on the waitlist! We'll notify you soon.");
            } else {
                console.error(data);
                setStatus("error");
                toast.error("Something went wrong. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setStatus("error");
            toast.error("Something went wrong. Try again!");
        }
    };
    async function getTagId() {
        const response = await fetch(`https://api.convertkit.com/v3/tags?api_key=${import.meta.env.VITE_KIT_API_KEY}`);
        const data = await response.json();
        console.log(data);

    }
    getTagId()
    return (
        <div className="flex flex-col items-center justify-center px-5">
            <div className="w-full sm:w-[600px] bg-white p-5 sm:p-10 rounded-2xl shadow-md text-center">
                <Mail className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-600 mx-auto mb-4" />
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-3">Join the Waitlist 🚀</h1>
                <p className="text-gray-600 mb-6 text-sm sm:text-md">
                    Be the first to know when premium plans go live. Enter your email below 👇
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-lg"
                    />

                    <div className="flex w-2/3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">

                        <select
                            value={planType}
                            onChange={(e) => setPlanType(e.target.value)}
                            className="w-[99%] text-sm sm:text-lg focus:ring-2 focus:ring-indigo-500 outline-none rounded-xl px-4 py-3"
                            required
                        >
                            <option value="Basic" className="text-xs sm:text-sm">Basic</option>
                            <option value="Pro" className="text-xs sm:text-sm">Pro</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                    >
                        {status === "loading" ? "Joining..." : "Join Waitlist"}
                    </button>
                </form>

                <p className="text-sm text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
            </div>
        </div>
    );
}
