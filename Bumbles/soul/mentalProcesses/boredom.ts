import { html } from "common-tags";
import { internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";

const boredom: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("SynApp feed", false);

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
  log("Should the soul spectate?", shouldSpectate);
  if (shouldSpectate) {
    spectate.current = true;
    log("Entering spectate mode.");
    setNextProcess(boredom); 
  } else {
    spectate.current = false;
    setNextProcess(initialProcess); 
  }

  return initialStep;
};

export default boredom;

