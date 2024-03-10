import { html } from "common-tags";
import { internalMonologue, mentalQuery, decision, externalDialog } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";
import { yosefInterests } from "../lib/interests.js";

//Deserves a better home, but this is an analog to the defaultEmotion

export const defaultTopic = {
    topic: "chiral molecules",
    why: "Yosef is obsessed with the biochemistry behind chiral molecules and how they're used to create new drugs."
  }

const awkward: MentalProcess = async ({ step: initialStep }) => {

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "awkward";

  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("SynApp feed", false);
  
  const yosefTopics = useSoulMemory("Topic of interest", defaultTopic)

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
      ${initialStep.entityName} thought to himself: Respond with the topic that Yosef would rather talk about. Make sure to include one of these topics: ${yosefInterests.join(", ")} and a very short sentence as to why he chose that one.
    `)

    const extractedTopic = await finalStep.compute(decision("Extract the topic of interest that Yosef just said they want to shift over to.", yosefInterests)) 

    yosefTopics.current = {
      topic: extractedTopic.toString(),
      why: finalStep.value
    }
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess)
    log(`Yosef is changing the topic of discussion to one of these interests: ${yosefTopics.current.topic}`);

    const nextStep = await initialStep.next(externalDialog("Yosef tries to change the topic of discussion to the one he just chose.", yosefTopics.current.topic), { model: "quality" })
    speak(nextStep.value)

    return finalStep
  }

  return lastStep;
};

export default awkward;

