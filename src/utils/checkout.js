export const createCheckoutSession = async (planName, interval) => {
  try {
    const res = await fetch(
      "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/create-checkout-session",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName, interval }),
      }
    );

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Failed to create checkout session");
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};
