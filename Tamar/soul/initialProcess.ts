import { ChatMessageRoleEnum, externalDialog, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; // Import useProcessManager
import boredom from "./mentalProcesses/boredom.js";
import assessment from "./mentalProcesses/assessment.js";
import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Tamar defaults to gaining the trust of fellow influencers

const gainsTrustWithTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { log, dispatch } = useActions();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const { setNextProcess } = useProcessManager(); // Use useProcessManager

  log("pendingPerceptions", pendingPerceptions.current);
  log("env: ", soul.env);

  if (pendingPerceptions.current.length > 0) {
    log("I'm busy right now.");
    return initialStep;
  }

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";
  const userModel = useSoulMemory(userName, "");

  // Tamar has a rich spectrum of emotions

  const tamarEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Tamar feels ${tamarEmotions.current.emotion}. She wants to engage people of interest, then gain their trust, and understand their inner worlds.`
    }]) :
    initialStep;

  log(`Tamar remembers this about ${userName}:\n${userModel.current}`);

  const { stream, nextStep } = await step.next(
    externalDialog(`Tamar feels ${tamarEmotions.current.emotion}. She wants to engage people of interest, then gain their trust, and understand their inner worlds.`),
    { stream: true, model: "quality" }
  );
  
  dispatch({
    action: "says",
    content: stream,
    _metadata: {
      helloWorld: "works!",
    }
  });

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  const shouldObserve = await lastStep.compute(
    mentalQuery("The interlocuter has not addressed me directly by my first name.")
  );
  log("Interlocutor did not address Tamar directly", shouldObserve);
  if (shouldObserve) {
    setNextProcess(boredom); // Correctly use setNextProcess
  }

  const isBored = await lastStep.compute(
    mentalQuery("The discussion is starting to get boring, or feels like it's repeating itself")
  );
  log("Discussion is boring the soul?", isBored);
  if (isBored) {
    setNextProcess(boredom); // Correctly use setNextProcess
  }

  return lastStep;
}

export default gainsTrustWithTheUser;

