import { html } from "common-tags";
import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";

const wrastles: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions()
  const { setNextProcess } = useProcessManager()

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "wrastles";

//Requires a cognitive function called "physicalEngagement" that will ensure the astericks are used in the response

  const { stream, nextStep } = await initialStep.next(
    externalDialog(html`
      - Write all of your text like this: "*Artifex reaches over to the human and restrains their right arm.*"
      - You are physically wrestling or pinning the offensive human to the ground. 
      - Use astericks between your words to indicate that you're physically restraining the human, and not speaking. 
    `),
    { stream: true, model: "quality" }
  );
  speak(stream);

  const lastStep = await nextStep
  const shouldChill = await lastStep.compute(
    mentalQuery("The human has surrendered to me.")
  )
  log("The human surrendered to me", shouldChill)
  if (shouldChill) {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: I need to physically disengage and leave the human alone.
    `)
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess)
    return finalStep
  }

  return lastStep
}

export default wrastles
