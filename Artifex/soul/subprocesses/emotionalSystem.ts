import { decision, internalMonologue } from "socialagi";
import { MentalProcess, useActions, useSoulMemory, usePerceptions } from "soul-engine";
import { androidEmotions } from "../lib/android-emotions.js";
import { html } from "common-tags";

export const defaultEmotion = {
  emotion: "Sardonic",
  why: "Artifex is amused by human civilization, and the professional state of most humans."
}

const emotionalSystem: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const { invokingPerception } = usePerceptions();
  const artifexEmotions = useSoulMemory("emotionalState", defaultEmotion)

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";

  const emotionalStep = await initialStep.next(internalMonologue(html`
    Artifex currently feels: ${artifexEmotions.current.emotion}.
    Has anything happened that would change how Artifex feels?
    Respond with how Artifex is feeling. Make sure to include one of these emotions: ${androidEmotions.join(", ")} and a very short sentence as to why he feels that way because of ${userName}.
  `, 'felt'))
  log("Artifex's feelings", emotionalStep.value)

  const extractedEmotion = await emotionalStep.compute(decision("Extract the emotion that Artifex just said they are feeling.", androidEmotions)) 

  artifexEmotions.current = {
    emotion: extractedEmotion.toString(),
    why: emotionalStep.value
  }

  log("Artifex's emotions", artifexEmotions.current)

  // no memories on the users for now
  return initialStep
}

export default emotionalSystem
