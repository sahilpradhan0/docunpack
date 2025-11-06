export const createCheckoutSession = async (
  planName,
  interval,
  accessToken
) => {
  try {
    const res = await fetch(
      "https://uhkbyfmvgnsbeltanizg.functions.supabase.co/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`, // <-- pass token
        },
        body: JSON.stringify({ plan: planName, interval }),
      }
    );
    console.log(planName, interval);

    const data = await res.json();
    console.log("CHECKOUT_DATA",data);

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert("Failed to create checkout session");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};
