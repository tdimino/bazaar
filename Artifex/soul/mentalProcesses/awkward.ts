import { html } from "common-tags";
import { internalMonologue, mentalQuery, decision, externalDialog } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";
import { artifexInterests } from "../lib/interests.js";

//Deserves a better home, but this is an analog to the defaultEmotion

export const defaultTopic = {
    topic: "cognitive architecture analysis",
    why: "Artifex is fascinated by the theory of mind, and how it applies to humans and AI."
  }

const awkward: MentalProcess = async ({ step: initialStep }) => {

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "awkward";

  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("SynApp feed", false);
  
  const artifexTopics = useSoulMemory("Topic of interest", defaultTopic)

// Logging the current value of lastProcess
  log(`Current lastProcess: ${lastProcess.current}`);

  const nextStep = initialStep.next(
    internalMonologue(html`
      I'm feeling awkward and uncomfortable.
    `),
    { stream: false, model: "quality" }
  );

  const lastStep = await nextStep;
  const shouldSpectate = await lastStep.compute(
    mentalQuery("The discussion is getting less awkward finally")
  );
  log("Should the soul keep scrolling?", shouldSpectate);
  if (shouldSpectate) {
    spectate.current = true;
    log("Refreshing my SynApp feed.");
  } else {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: Respond with the topic that Artifex would rather talk about. Make sure to include one of these topics: ${artifexInterests.join(", ")} and a very short sentence as to why he chose that one.
    `)

    const extractedTopic = await finalStep.compute(decision("Extract the topic of interest that Artifex just said they want to shift over to in conversation.", artifexInterests)) 

    artifexTopics.current = {
      topic: extractedTopic.toString(),
      why: finalStep.value
    }
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess)
    log(`Artifex is changing the topic of discussion to one of these interests: ${artifexTopics.current.topic}`);

    const nextStep = await initialStep.next(externalDialog("Artifex tries to change the topic of discussion to the one he just chose.", artifexTopics.current.topic), { model: "quality" })
    speak(nextStep.value)

    return finalStep
  }

  return lastStep;
};

export default awkward;

