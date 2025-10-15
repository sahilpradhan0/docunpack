import { useContext } from "react";
import { InputContext } from "./InputContext";

export const useInput = () => useContext(InputContext);