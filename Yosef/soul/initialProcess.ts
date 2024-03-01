import { ChatMessageRoleEnum, externalDialog, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine";
import boredom from "./mentalProcesses/boredom.js";
import noticesTheTime from "./mentalProcesses/noticesTheTime.js";
import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Yosef makes an entrance (adapted from Alfred's 'initial process').

const introduction: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log } = useActions()
  const { invocationCount, setNextProcess } = useProcessManager()

  if (invocationCount === 0) {
    const { stream, nextStep } = await initialStep.next(
      externalDialog("Greet the Bazaar in the most flowery way possible, since you're high as hell."), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    return nextStep
  } else {
    return initialStep
  }
}

// Yosef gets anxious about the time. He's always checking it.

const timeToCheck: MentalProcess = async ({ step: initialStep }) => {
  const { scheduleEvent } = useActions()
  const { setNextProcess } = useProcessManager()
  const pendingScheduled = useSoulMemory("pendingScheduled", false)

  scheduleEvent({
    process: noticesTheTime,
    in: 30, // notice the time every 60s,
    perception: {
      name: "Yosef",
      action: "notice",
      content: "the time",
    }
  })
  pendingScheduled.current = true

  setNextProcess(gainsTrustWithTheUser)

  return initialStep
}

// Yosef returns to creeping

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
    externalDialog(`Yosef feels ${yosefEmotions.current.emotion}. He wants to engage with all of the beautiful women around him, gain their trust, and understand their inner worlds.`),
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

  // Boredom keeps these chatty birds from bankrupting Kev and Topper, and makes the ebb and flow of the group discussions more realistic.

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
