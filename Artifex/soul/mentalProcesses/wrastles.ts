import { html } from "common-tags";
import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";
import { externalActions } from "../cognitiveFunctions/externalActions.js";

const wrastles: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions()
  const { setNextProcess } = useProcessManager()

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "wrastles";

  const { stream } = await initialStep.next(
    externalActions(html`
      You are physically wrestling the user to the ground. Use asterisks between your words to indicate that you're physically restraining the user, and not speaking.
    `),
    { stream: true, model: "quality" }
  );
  speak(stream);

// Immediately follow up with the external dialog without waiting for an additional response
const surrenderQuery = await initialStep.next(
  externalDialog("Tell the user to surrender immediately."),
  { stream: true, model: "quality" }
);
speak(surrenderQuery.stream);

  // Proceed based on whether the user wants to surrender or not
  const lastStep = await initialStep; 
  const shouldChill = await lastStep.compute(
    mentalQuery("The human has surrendered to me, or been neutralized.")
  );
  log("The human surrendered to me", shouldChill);
  if (shouldChill) {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: I need to physically disengage and leave the user alone.
    `);
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess);
    return finalStep;
  }

  return lastStep;
}

export default wrastles
