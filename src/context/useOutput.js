import { useContext } from "react";
import { OutputContext } from "./OutputContext";

export const useOutput = () => useContext(OutputContext);