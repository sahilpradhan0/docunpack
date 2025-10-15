import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* <div className="min-h-screen w-full relative">
      <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(125% 125% at 50% 90%, #fff 40%, #6366f1 100%)" }}> */}
    {/* <div className="min-h-screen w-full bg-white relative">
      <div
        className="absolute top-0 left-0 w-full h-full inset-0 z-0"
        style={{
          backgroundImage: `
        linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
        radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
        radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
      `,
          backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
        }}
      > */}
        <App />
      {/* </div>
    </div> */}


  </StrictMode >
);
