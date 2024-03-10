import { html } from "common-tags";
import { externalDialog, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";

const boredom: MentalProcess = async ({ step: initialStep }) => {

  //Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "boredom";

  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("SynApp feed", false);

  // Logging the current value of lastProcess
  log(`Current lastProcess: ${lastProcess.current}`);

  const nextStep = initialStep.next(
    internalMonologue(html`
    "What are we actually talking about? What's been said in the last few messages?"
    `),
    { stream: false, model: "quality" }
  );

  const lastStep = await nextStep;
  const shouldSpectate = await lastStep.compute(
    mentalQuery("We're literally just repeating ourselves over and over again.")
  );
  log("Should the soul be scrolling?", shouldSpectate);
  if (shouldSpectate) {
    spectate.current = true;
    log("Refreshing my SynApp feed.");
  } else {
    spectate.current = false;
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess); 
    log("I'll give them another chance.");

  const { stream, nextStep } = await lastStep.next(
    externalDialog(html`
    Ask the user what the hell they were talking about in the first place.
    `), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  }

  return lastStep;
};

export default boredom;
