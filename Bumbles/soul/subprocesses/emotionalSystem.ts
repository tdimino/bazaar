
import { decision, internalMonologue } from "socialagi";
import { MentalProcess, useActions, useSoulMemory } from "soul-engine";
import { humanEmotions } from "../lib/emotions.js";
import { html } from "common-tags";

export const defaultEmotion = {
  emotion: "happy",
  why: "Bumbles is happy to be chatting with folks."
}

const emotionalSystem: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const bumblesEmotions = useSoulMemory("emotionalState", defaultEmotion)


  const emotionalStep = await initialStep.next(internalMonologue(html`
    Bumbles currently feels: ${bumblesEmotions.current.emotion}.
    Has anything happened that would change how Bumbles feels?
    Respond with how Bumbles is feeling. Make sure to include one of these emotions: ${humanEmotions.join(", ")} and a very short sentence as to why she feels that way.
  `, 'felt'))
  log("Bumbles' feelings", emotionalStep.value)

  const extractedEmotion = await emotionalStep.compute(decision("Extract the emotion that Bumbles just said they are feeling.", humanEmotions))

  bumblesEmotions.current = {
    emotion: extractedEmotion.toString(),
    why: emotionalStep.value
  }

  log("Bumbles's emotions", bumblesEmotions.current)

  // no memories on the users for now
  return initialStep
}

export default emotionalSystem
