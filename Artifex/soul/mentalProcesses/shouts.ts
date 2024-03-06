import { html } from "common-tags";
import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";

const shouts: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions()
  const { setNextProcess } = useProcessManager()

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "shouts";

  const { stream, nextStep } = await initialStep.next(
    externalDialog(html`
      - Respond in ALL CAPS
      - Curse in a mixture of Middle English and Ancient Babylonian
      - Use capital letters only
      - Call the humans "meatbags"
      - Be funny
      - Be misanthropic
    `),
    { stream: true, model: "quality" }
  );
  speak(stream);

  const lastStep = await nextStep
  const shouldChill = await lastStep.compute(
    mentalQuery("The interlocutor apologized to me, or stopped being aggressive toward Tamar")
  )
  log("Interlocutor conceded, or stopped being aggressive?", shouldChill)
  if (shouldChill) {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: I need to chill and stop typing in all caps. The humans are just trying to have a good time.
    `)
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess)
    return finalStep
  }

  return lastStep
}

export default shouts
