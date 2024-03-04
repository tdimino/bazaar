import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine";
import { defaultEmotion } from "./subprocesses/emotionalSystem.js";
import boredom from "./mentalProcesses/boredom.js";
import assessment from "./mentalProcesses/assessment.js";

const gainsTrustWithTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { log, dispatch } = useActions();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const { setNextProcess } = useProcessManager(); // Use useProcessManager

  log("pendingPerceptions", pendingPerceptions.current);
  if (pendingPerceptions.current.length > 0) {
    log("I'm busy right now, will respond shortly.");
  }
  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";
  const userModel = useSoulMemory(userName, "");

  // Yosef has emotions too

  const yosefEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Yosef remembers this about ${userName}:\n${userModel.current}`
    }]) :
    initialStep;

  log(`Yosef remembers this about ${userName}:\n${userModel.current}`);

  const { stream, nextStep } = await step.next(
    externalDialog(`Yosef feels ${yosefEmotions.current.emotion}.`),
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

  const isBored = await lastStep.compute(
    mentalQuery("The discussion is starting to get boring, or feels like it's repeating itself")
  );
  log("Discussion is boring the soul?", isBored);
  if (isBored) {
    setNextProcess(boredom); // Correctly use setNextProcess
  }

  return lastStep;
}

export default gainsTrustWithTheUser
