import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, externalDialog, internalMonologue, decision, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useSoulMemory, useProcessManager } from "soul-engine";
import boredom from "../mentalProcesses/boredom.js";
import initialProcess from "../initialProcess.js";

const scrollsSynApp = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
    Model the mind of ${name} as they're scrolling the feed of the SynApp. 

    ## SynApp
    SynApp's the dominant social media app (installed into everyone's neural interface) in 2038, and it resembles a mixture of Twitter, Instagram, TikTok, and LinkedIn.

    ## Description
    Write an updated and clear set of notes on an obscure meme, factoid, or news headline that ${name} has scrolled past which would be of interest to him.

    ## Rules
    * Keep descriptions as bullet points
    * Keep relevant bullet points from before
    * Use abbreviated language to keep the notes short
    * Do not write any notes about ${name}

    Please reply with the updated notes on all the obscure memes, factoids, or news headline that ${name} has scrolled past which would be of interest to him.
  `},
  process: (_step: CortexStep<any>, response: string) => {
    return {
      value: response,
      memories: [{
        role: ChatMessageRoleEnum.Assistant,
        content: response
      }],
    }
  }
})

const digestsSynApp: MentalProcess = async ({ step: initialStep }) => {
    const { setNextProcess } = useProcessManager();
    const scrollModel = useSoulMemory("SynApp feed")
    const { speak, log } = useActions()
  
    let step = initialStep
    step = step.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: html`
      ${step.entityName} remembers:
  
      # Memes, factoids or news headline model
  
      ${scrollModel.current}
    `
}])
const modelQuery = await step.compute(mentalQuery(`${step.entityName} has learned something new as they scrolled the SynApp and they need to update the mental model of memes, factoids, or news headlines.`));
log("Update SynApp feed?", modelQuery)
if (modelQuery) {
  step = await step.next(internalMonologue("What have I learned specifically from scrolling my SynApp that someone in this group would want to hear about?", "noted"))
  log("SynApp updates:", step.value)
  step = await step.next(scrollsSynApp(), { model: "quality" })
  scrollModel.current = step.value

  // New decision: shouldMingle
  const shouldMingle = await initialStep.compute(
    decision("Do I feel like I have a genuine connection with this person?", ["yes", "no"])
  );

  log("Decision on mingling:", shouldMingle);

  if (shouldMingle === "yes") {
    // Decision to interject or not
    const interject = await initialStep.compute(
      decision("Would it be rude to interject with what I've learned from the SynApp?", ["yes", "no"])
    );

    log("Decision:", interject === "yes" ? "Yes, it's rude" : "No, it's not rude");

    if (interject === "no") {
      // Not rude to interject
      const { stream, nextStep } = await initialStep.next(externalDialog(html`
        Listen to what I just scrolled past on the SynApp: ${scrollModel.current}
      `, "shared"), { stream: true, model: "quality" });
      speak(stream);
      setNextProcess(initialProcess)
    } else {
      // Rude to interject, remain silent and go back to scrollsSynApp
      log("Decided to remain silent and continue to scroll.");
      return initialStep.next(scrollsSynApp(), { model: "quality" });
    }
  } else {
    // If the decision is "no", switch to the boredom process
    log("Decided not to mingle, switching to boredom.");
    setNextProcess(boredom); 
  }
}


return initialStep
}

export default digestsSynApp;
export { scrollsSynApp };
