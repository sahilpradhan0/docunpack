import { useContext } from "react";
import { GeminiContext } from "./GeminiContext";

export const useGeminiContext = () => useContext(GeminiContext);