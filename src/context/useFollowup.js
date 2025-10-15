import { useContext } from "react";
import { FollowUpContext } from "./FollowupContext";

export const useFollowup = () => useContext(FollowUpContext);