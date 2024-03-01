import { html } from "common-tags";
import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager } from "soul-engine";
import initialProcess from "../initialProcess.js";

const shouts: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions()
  const { setNextProcess } = useProcessManager()

  const { stream, nextStep } = await initialStep.next(
    externalDialog(html`
      - Respond in ALL CAPS
      - Curse in a mixture of Middle English and Ancient Akkadian
      - Use capital letters only
      - Call the humans "meatbags" and "organic sacks of sh*t"
      - Be funny
      - Be misanthropic
    `),
    { stream: true, model: "quality" }
  );
  speak(stream);

  const lastStep = await nextStep
  const shouldChill = await lastStep.compute(
    mentalQuery("The speaker apologized, or shut the hell up")
  )
  log("Speaker apologized, or shut the hell up?", shouldChill)
  if (shouldChill) {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: I need to chill and stop demeaning these humans. Imma stop shouting in all caps.
    `)
    setNextProcess(initialProcess)
    return finalStep
  }

  return lastStep
}

export default shouts
