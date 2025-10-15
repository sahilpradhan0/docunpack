import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import 'keen-slider/keen-slider.min.css';
import { supabase } from "../../supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { plans } from "../../pricingPlan";

export default function Pricing() {
  const { refreshProfile, profile, session, user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(profile?.subscription_type || "free");
  const nav = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 1,
      spacing: 15,
    },
    breakpoints: {
      "(min-width: 640px)": {
        slides: { perView: 1, spacing: 10 },
      },
      "(min-width: 768px)": {
        slides: { perView: 2, spacing: 10 },
      },
      "(min-width: 1024px)": {
        slides: { perView: 3, spacing: 10 },
      },
    },
    mode: "snap",
    origin: "center"
  });
  const upgradePlan = async (planName, billingCycle) => {
    console.log(planName);

    if (!session) {
      toast.error("Please log in first");
      return;
    }
    try {
      const resp = await fetch("https://uhkbyfmvgnsbeltanizg.functions.supabase.co/update-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: planName, interval: billingCycle })
      });
      if (!resp.ok) {
        console.log("Something went wrong. Please try again!");
        return;
      }
      const respData = await resp.json();
      console.log(respData);
      toast.success(respData.message)
    } catch (error) {
      console.log(error.message);
    }
  };
  useEffect(() => {
    setCurrentPlan(profile?.subscription_type || "free");
  }, [profile]);
  return (
    <section id="pricing" className="w-full min-h-screen">
      <div className="flex flex-col justify-center items-center text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Pricing Plans</h2>
        <p className="text-gray-600 mb-8">
          Choose the plan that fits your needs. Upgrade anytime.
        </p>
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${billingCycle === "monthly"
                ? "bg-indigo-600 text-white"
                : "text-gray-700"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${billingCycle === "yearly"
                ? "bg-indigo-600 text-white"
                : "text-gray-700"
                }`}
            >
              Yearly <span className={`ml-1 text-xs ${billingCycle === "yearly"
                ? "text-green-200"
                : ""
                }`}>(Save 2 months)</span>
            </button>
          </div>
        </div>
        <div ref={sliderRef} className="keen-slider">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`keen-slider__slide rounded-2xl border shadow-sm p-8 flex flex-col h-[550px] lg:scale-90 ${plan.name.toLowerCase() === currentPlan
                ? "border-indigo-600 bg-indigo-50 shadow-lg lg:scale-100"
                : "border-gray-200 bg-white"
                }`}
            >
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">{plan.name}</h3>
              <p className="text-2xl sm:text-4xl font-bold mb-2">{billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}</p>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              <ul className="text-left space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <Check className="text-green-500 w-5 h-5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                // disabled={plan.name.toLowerCase() === currentPlan}
                disabled={user && plan.name.toLowerCase() === currentPlan}
                // onClick={() => upgradePlan(plan.name.toLowerCase(), billingCycle)}
                onClick={() => {
                  if (!user) {
                    nav("/login"); // redirect to login/signup
                  } else if (plan.name.toLowerCase() === currentPlan) {
                    toast.info("You're already on this plan");
                  } else {
                    nav("/waitlist");
                    // or call upgradePlan(plan.name.toLowerCase(), billingCycle)
                  }
                }}
                className={`mt-6 mb-6 py-3 rounded-xl font-semibold transition w-full 
                ${user && plan.name.toLowerCase() === currentPlan
                    ? "bg-gray-300 text-black cursor-not-allowed opacity-70"
                    : "bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer"
                  }`}
              >
                {user && plan.name.toLowerCase() === currentPlan
                  ? "Current Plan"
                  : ["basic", "pro"].includes(plan.name.toLowerCase())
                    ? "Join Waitlist"
                    : !user
                      ? "Try For Free"
                      : plan.button || "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
