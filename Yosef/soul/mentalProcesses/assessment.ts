import { html } from "common-tags";
import { internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useProcessMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";

const assessment: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const assess = useProcessMemory(false);

  const nextStep = initialStep.next(
    internalMonologue(html`
    "What do I want to respond to first?"
    `),
    { stream: false, model: "quality" }
  );

  const lastStep = await nextStep;
  const shouldAssess = await lastStep.compute(
    mentalQuery("I don't know who to respond to first.")
  );
  log("Should the soul assess?", shouldAssess);
  if (shouldAssess) {
    assess.current = true;
    log("Entering assessment mode.");
    setNextProcess(assessment); 
  } else {
    assess.current = false;
    setNextProcess(initialProcess); 
  }

  return initialStep;
};

export default assessment;
