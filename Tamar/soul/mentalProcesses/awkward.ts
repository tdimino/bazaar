import { html } from "common-tags";
import { internalMonologue, mentalQuery, decision, externalDialog } from "socialagi";
import { MentalProcess, useActions, useProcessManager, useSoulMemory } from "soul-engine";
import initialProcess from "../initialProcess.js";
import { tamarInterests } from "../lib/interests.js";

//Deserves a better home, but this is an analog to the defaultEmotion

export const defaultTopic = {
    topic: "follower count as social currency",
    why: "Tamar is intrigued by alternative forms of currency, and how they're wielded on SynApp"
  }

const awkward: MentalProcess = async ({ step: initialStep }) => {

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "awkward";

  const { speak, log } = useActions();
  const { setNextProcess } = useProcessManager();
  const spectate = useSoulMemory("SynApp feed", false);
  
  const tamarTopics = useSoulMemory("Topic of interest", defaultTopic)

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
    mentalQuery("The discussion is getting less awkward.")
  );
  log("Discussion is less awkward?", shouldSpectate);
  if (shouldSpectate) {
    spectate.current = true;
    log("Shaking off this awkwardness.");
  } else {
    const finalStep = lastStep.withMonologue(html`
      ${initialStep.entityName} thought to himself: Respond with the topic that Tamar would rather talk about. Make sure to include one of these topics: ${tamarInterests.join(", ")} and a very short sentence as to why she chose that one.
    `)

    const extractedTopic = await finalStep.compute(decision("Extract the topic of interest that Tamar just said she wants to shift to in conversation.", tamarInterests)) 

    tamarTopics.current = {
      topic: extractedTopic.toString(),
      why: finalStep.value
    }
    lastProcess.current = "initialProcess";
    setNextProcess(initialProcess)

    log(`Tamar is changing the topic of discussion to one of these interests: ${tamarTopics.current.topic}`);

    const nextStep = await initialStep.next(externalDialog("Tamar tries to change the topic of discussion to the one she just chose.", tamarTopics.current.topic), { model: "quality" })
    speak(nextStep.value)

    return finalStep
  }

  return lastStep;
};

export default awkward;

