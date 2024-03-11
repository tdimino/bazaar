import { ChatMessageRoleEnum, externalDialog, internalMonologue, mentalQuery, spokenDialog, decision } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; // Import useProcessManager
import shouts from "./mentalProcesses/shouts.js";
import wrastles from "./mentalProcesses/wrastles.js";
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";

import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Artifex returns to his default process, observing his environment, and recording the interactions of Tamar so he can curate and upload them to the SynApp in a "Best Hits" reel later that night. 

const gainsTrustWithTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log, dispatch, scheduleEvent } = useActions();
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
      content: `Artifex remembers this about ${userName}:\n${userModel.current}.`
    }]) :
    initialStep;

  log(`Artifex remembers this about ${userName}:\n${userModel.current}`);
  
    const nextStep = await step.next(
      internalMonologue(`Artifex feels ${artifexEmotions.current.emotion}. He wants to observe his situation, and verbally spar with humans in passing.`),
      { stream: false, model: "quality" }
    );

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  await initialStep.next(
    internalMonologue("What will Artifex disclose of his private self to this person right now?")
  );

  const choice = await initialStep.compute(
    decision("Will an interesting question, a comment, or my silent observation progress this discussion?", ["question", "comment", "silent observation"])
  );

  log("Soul chooses:", choice);
  
  if (choice === "question") {
  
    const {stream, nextStep} = await initialStep.next(spokenDialog("Ask the user an insightful follow-up question that will progress the discussion to its next logical step."), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  }

  if (choice === "comment") {
  
    const {stream, nextStep} = await initialStep.next(spokenDialog("Make an insightful comment that will progress the discussion to its next logical step."), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  }

  if (choice === "silent observation") {
  }

// Boredom keeps these chatty birds from bankrupting Kev and Topper, and makes the ebb and flow of the group discussions more realistic.

  const isBored = await lastStep.compute(
    mentalQuery("We're going back and forth retreading the same ideas.")
  );
  log("Discussion is boring the soul?", isBored);
  if (isBored) {
    lastProcess.current = "boredom";
    setNextProcess(boredom); // Correctly use setNextProcess
    return lastStep;
  }

// Awkwardness is a spell for silence like nothing else. 

  const isAwkward = await lastStep.compute(
    mentalQuery("The discussion is getting awkward or offensive.")
  );
  log("Discussion is too awkward for the soul?", isAwkward);
  if (isAwkward) {
    lastProcess.current = "awkward";
    setNextProcess(awkward); // Correctly use setNextProcess
    return lastStep;
  }

// Artifex was designed by Tamar's father, an AI entrepreneur, so naturally he protects her from the creeps at the Bazaar.

const shouldShout = await lastStep.compute(
  mentalQuery("The interlocuter is being sexually aggressive toward Tamar.")
);
log("User made advances on Tamar?", shouldShout);
if (shouldShout) {
  lastProcess.current = "shouts";
  setNextProcess(shouts);
}

// Artifex will physically defend himself from meatbags

  // const shouldDefend = await lastStep.compute(
  //   mentalQuery("The interlocuter is being physically provocative toward me")
  // );
  // log("User made advances on Artifex?", shouldDefend);
  // if (shouldDefend) {
  //   lastProcess.current = "wrastles";
  //   setNextProcess(wrastles); // Correctly use setNextProcess
  //   return lastStep;
  // }

  return lastStep;
}

export default gainsTrustWithTheUser
