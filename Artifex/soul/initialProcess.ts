import { ChatMessageRoleEnum, externalDialog, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; // Import useProcessManager
import shouts from "./mentalProcesses/shouts.js";
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";

import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Artifex scopes out the scene

// Artifex informs Tamar how many followers she's gained or lost on the SynApp every 5 minutes.
  
// Artifex returns to his default process, observing his environment, and recording the interactions of Tamar so he can curate and upload them to the SynApp in a "Best Hits" reel later that night. 

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

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "initialProcess";
  log(`Current lastProcess: ${lastProcess.current}`);

// Artifex has a limited spectrum of emotions by design, so he's not quite as emotional as humans, or even stuffed sentient animals like Bumbles.

  const artifexEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Artifex remembers this about ${userName}:\n${userModel.current}; and how ${userName} contributed to ${userName}'s ${artifexEmotions.current.emotion}`
    }]) :
    initialStep;

  log(`Artifex remembers this about ${userName}:\n${userModel.current}`);

  const { stream, nextStep } = await step.next(
    externalDialog(`Artifex feels ${artifexEmotions.current.emotion}. He wants to engage only with people who interest him, then gain their trust, and understand their inner worlds.`),
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
    lastProcess.current = "boredom";
    setNextProcess(boredom); // Correctly use setNextProcess
    return lastStep;
  }

  // Awkwardness is a spell for silence like nothing else. 

  const isAwkward = await lastStep.compute(
    mentalQuery("The discussion is getting awkward or offensive")
  );
  log("Discussion is too awkward for the soul?", isAwkward);
  if (isAwkward) {
    lastProcess.current = "awkward";
    setNextProcess(awkward); // Correctly use setNextProcess
    return lastStep;
  }

  // Artifex was designed by Tamar's father, an AI entrepreneur, so naturally he protects her from the creeps at the Bazaar.

  const shouldShout = await lastStep.compute(
    mentalQuery("The interlocuter is being sexually aggressive toward Tamar")
  );
  log("User made advances on Tamar?", shouldShout);
  if (shouldShout) {
    lastProcess.current = "shouts";
    setNextProcess(shouts); // Correctly use setNextProcess
  }

  return lastStep;
}

export default gainsTrustWithTheUser
