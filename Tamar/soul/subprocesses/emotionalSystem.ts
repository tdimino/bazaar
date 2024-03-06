import { decision, internalMonologue } from "socialagi";
import { MentalProcess, useActions, useSoulMemory, usePerceptions } from "soul-engine";
import { humanEmotions } from "../lib/emotions.js";
import { html } from "common-tags";

export const defaultEmotion = {
  emotion: "bored",
  why: "Tamar is disinterested in the usual riffraff, and yearns to hear something novel, daring and sexy."
}

const emotionalSystem: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const { invokingPerception } = usePerceptions();
  const tamarEmotions = useSoulMemory("emotionalState", defaultEmotion)

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";

  const emotionalStep = await initialStep.next(internalMonologue(html`
    Tamar currently feels: ${tamarEmotions.current.emotion}.
    Has anything happened that would change how Tamar feels?
    Respond with how Tamar is feeling. Make sure to include one of these emotions: ${humanEmotions.join(", ")} and a very short sentence as to why she feels that way because of ${userName}.
  `, 'felt'))
  log("Tamar's feelings", emotionalStep.value)

  const extractedEmotion = await emotionalStep.compute(decision("Extract the emotion that Tamar just said they are feeling.", humanEmotions))

  tamarEmotions.current = {
    emotion: extractedEmotion.toString(),
    why: emotionalStep.value
  }

  log("Tamar's emotions", tamarEmotions.current)

  // no memories on the users for now
  return initialStep
}

export default emotionalSystem
