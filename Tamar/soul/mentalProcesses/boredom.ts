import { html } from "common-tags";
import { internalMonologue, mentalQuery } from "socialagi";
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
      - Is this conversation engaging?
      - Do I find the topic interesting?
      - Are there more important things I could be thinking about?
      - What's happening on the SynApp?
    `),
    { stream: false, model: "quality" }
  );

  const lastStep = await nextStep;
  const shouldSpectate = await lastStep.compute(
    mentalQuery("Nothing new is being said, and I'm not interested in this conversation.")
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
  }

  return lastStep;
};

export default boredom;

