import { usePerceptions, useSoulMemory } from "soul-engine";

// Utility function to fetch userName and userModel
export const fetchUserContext = () => {
  const { invokingPerception } = usePerceptions();
  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.nickname || "Anonymous";
  const userModel = useSoulMemory(userName, "");
  const selfModel = useSoulMemory(`${userName}'s internal model of the soul`, "");

  return { userName, userModel, selfModel };
};
