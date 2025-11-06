import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("https://uhkbyfmvgnsbeltanizg.functions.supabase.co/subscribe-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, formType: "newsletter" }),
      });
      const data = await res.json();
      console.log(data);
      
      if (res.ok) {
        setStatus("success");
        setEmail("");
        toast.success("🎉 Almost there! Check your email to confirm your subscription.");
      } else {
        console.error(data);
        setStatus("error");
        toast.error("Something went wrong. Try again!");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Something went wrong. Try again!");
    }
  };

  return (
    <section className="flex w-full bg-white/70 py-4 md:p-10 rounded-4xl">
      <div className="flex flex-col justify-center items-center px-6 text-center w-full">
        <Mail className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Stay in the Loop 🚀
        </h2>
        <p className="text-gray-600 mb-8">
          Subscribe to get updates on new features, product launches, and early access.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full lg:w-1/2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full flex-1 px-4 py-3 rounded-xl border border-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none text-[13px] sm:text-md md:text-lg"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
