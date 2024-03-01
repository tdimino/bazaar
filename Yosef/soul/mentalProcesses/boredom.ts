import { html } from "common-tags";
import { internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import processesSynApp from "../subprocesses/spectates.js";

const boredom: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("spectate", false);

  const { stream, nextStep } = await initialStep.next(
    internalMonologue(html`
      - Is this conversation engaging?
      - Do I find the topic interesting?
      - Are there more important things I could be thinking about?
      - What's happening on the SynApp?
    `),
    { stream: true, model: "quality" }
  );
  speak(stream);

  const lastStep = await nextStep;
  const isBored = await lastStep.compute(
    mentalQuery("I don't want to continue actively engaging in this conversation, and there's probably something more interesting happening on the SynApp.")
  );
  log("Is the soul bored?", isBored);
  if (isBored) {
    spectate.current = true;
    log("Entering spectate mode.");
    // Explicitly set the next process to spectate if the soul is bored
    setNextProcess(processesSynApp); 
  } else {
    spectate.current = false;
  }

  return lastStep;
};

export default boredom;
