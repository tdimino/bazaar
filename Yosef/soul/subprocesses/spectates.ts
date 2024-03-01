import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, externalDialog, internalMonologue, decision, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useSoulMemory } from "soul-engine";

const scrollsSynApp = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
      Model the mind of ${name} as they're scrolling the feed of the SynApp. 

      ## SynApp
      SynApp's the predominant social media app (pre-installed into everyone's neural interface) in 2038, and it resembles a mixture of Twitter, Instagram, TikTok, and LinkedIn.

      ## Description
      Write an updated and clear set of notes on an obscure meme, factoid, or news headlines that ${name} has scrolled past which would be of interest to him.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Use abbreviated language to keep the notes short
      * Do not write any notes about ${name}

      Please reply with the updated notes on all the obscure memes, factoids, or news headlines that ${name} has scrolled past which would be of interest to him. 
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

const processesSynApp: MentalProcess = async ({ step: initialStep }) => {
    const scrollModel = useSoulMemory("SynApp feed")
    const { speak, log } = useActions()
  
    let step = initialStep
    step = step.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: html`
      ${step.entityName} remembers:
  
      # Memes, factoids or news headlines model
  
      ${scrollModel.current}
    `
}])
const modelQuery = await step.compute(mentalQuery(`${step.entityName} has learned something new as they scrolled the SynApp and they need to update the mental model of memes, factoids, or news items.`));
log("Update model?", modelQuery)
if (modelQuery) {
  step = await step.next(internalMonologue("What have I learned specifically from scrolling SynApp that someone in this group would want to hear about?", "noted"))
  log("Learnings:", step.value)
  step = await step.next(scrollsSynApp(), { model: "quality" })
  scrollModel.current = step.value

  // Decision to interject or not
  const interject = await initialStep.compute
    (decision("Would it be rude to interject with what I've learned on the SynApp?", ["yes", "no"]));

  log("Decision:", interject);

  if (interject === "no") {
    // Not rude to interject
    const { stream, nextStep } = await initialStep.next(externalDialog(html`
      Listen to what I just scrolled past on the SynApp: ${scrollModel.current}
    `, "shared"), { stream: true, model: "quality" });
    speak(stream);
    return initialStep;
  } else {
    // Rude to interject, remain silent and go back to scrollsSynApp
    log("Decided to remain silent and continue spectating.");
    return initialStep.next(scrollsSynApp(), { model: "quality" });
  }
}

return initialStep
}

export default processesSynApp

