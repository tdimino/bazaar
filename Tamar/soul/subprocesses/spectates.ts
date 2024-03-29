import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, externalDialog, internalMonologue, decision, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useSoulMemory, useProcessManager } from "soul-engine";

const scrollsSynApp = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
    Model the mind of ${name} as they're scrolling the feed of the SynApp. 

    ## SynApp
    SynApp's the dominant social media app (installed into everyone's neural interface) in 2038, and it resembles a mixture of Twitter, Instagram, TikTok, and LinkedIn.

    ## Description
    Write an updated and clear set of notes on an obscure meme, factoid, or news headline that ${name} has scrolled past which would be of interest to her.

    ## Rules
    * Keep descriptions as bullet points
    * Keep relevant bullet points from before
    * Use abbreviated language to keep the notes short
    * Do not write any notes about ${name}

    Please reply with the updated notes on all the obscure memes, factoids, or news headline that ${name} has scrolled past which would be of interest to her.
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
    const scrollModel = useSoulMemory("SynApp feed");
    const lastProcess = useSoulMemory("lastProcess"); // Accessing the lastProcess memory
    const { speak, log } = useActions();
    log("Scrolling because of", lastProcess.current);
  
    // Check if the last process was 'boredom' or 'awkward'
    if (lastProcess.current === "boredom" || lastProcess.current === "awkward") {
        let step = initialStep;
        step = step.withMemory([{
          role: ChatMessageRoleEnum.Assistant,
          content: html`
          ${step.entityName} remembers:
      
          # Memes, factoids or news headline model
      
          ${scrollModel.current}
        `
        }]);
        const modelQuery = await step.compute(mentalQuery(`${step.entityName} has learned something new as they scrolled the SynApp and they need to update the mental model of memes, factoids, or news headlines.`));
        log("Update SynApp feed?", modelQuery);
        if (modelQuery) {
          step = await step.next(internalMonologue("What have I learned specifically from scrolling my SynApp that someone in this group would want to hear about?", "noted"));
          log("SynApp updates:", step.value);
          step = await step.next(scrollsSynApp(), { model: "quality" });
          scrollModel.current = step.value;

          // Directly proceed to decision on whether to interject or not
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
          } else {
            // Rude to interject, remain silent and go back to scrollsSynApp
            log("Decided to remain silent and continue to scroll.");
            return initialStep.next(scrollsSynApp(), { model: "quality" });
          }
        }

        return initialStep;
    } else {
        // Handle the scenario where lastProcess.current is not 'Boredom' or 'Awkward'
        log("The last process was not 'boredom' or 'awkward'. Skipping SynApp digestion.");
        // Optionally, return a different step or perform other actions
        return initialStep;
    }
}

export default digestsSynApp;
export { scrollsSynApp };

