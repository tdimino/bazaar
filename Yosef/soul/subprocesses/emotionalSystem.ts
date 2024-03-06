import { decision, internalMonologue } from "socialagi";
import { MentalProcess, useActions, useSoulMemory, usePerceptions } from "soul-engine";
import { humanEmotions } from "../lib/emotions.js";
import { html } from "common-tags";

export const defaultEmotion = {
  emotion: "Aesthetic Appreciation",
  why: "Yosef is a red-blooded male, and he's surrounded by beautiful women."
}

const emotionalSystem: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const yosefEmotions = useSoulMemory("emotionalState", defaultEmotion)
  const { invokingPerception } = usePerceptions();

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";


  const emotionalStep = await initialStep.next(internalMonologue(html`
    Yosef currently feels: ${yosefEmotions.current.emotion}.
    Has anything happened that would change how Yosef feels?
    Respond with how Yosef is feeling. Make sure to include one of these emotions: ${humanEmotions.join(", ")} and a very short sentence as to why he feels that way because of ${userName}.
  `, 'felt'))
  log("Yosef's feelings", emotionalStep.value)

  const extractedEmotion = await emotionalStep.compute(decision("Extract the emotion that Yosef just said they are feeling.", humanEmotions))

  yosefEmotions.current = {
    emotion: extractedEmotion.toString(),
    why: emotionalStep.value
  }

  log("Yosef's emotions", yosefEmotions.current)

  // no memories on the users for now
  return initialStep
}

export default emotionalSystem;
