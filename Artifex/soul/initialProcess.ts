import { ChatMessageRoleEnum, externalDialog, internalMonologue, mentalQuery, decision } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; // Import useProcessManager
import shouts from "./mentalProcesses/shouts.js";
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";
import { externalActions } from "./cognitiveFunctions/externalActions.js";
import { fetchUserContext } from "./util/fetchUserContext.js"; 

import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Artifex returns to his default process, observing his environment, and recording the interactions of Tamar so he can curate and upload them to the SynApp in a "Best Hits" reel later that night. 

const gainsTrustWithTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log, dispatch, scheduleEvent } = useActions();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const { setNextProcess } = useProcessManager(); 
  
  log("pendingPerceptions", pendingPerceptions.current);
  log("env: ", soul.env);

  if (pendingPerceptions.current.length > 0) {
    log("I'm busy right now.");
    return initialStep;
  }

// Use the utility function to fetch userName, userModel, and selfModel
  const { userName, userModel, selfModel } = fetchUserContext();

//Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "initialProcess";
  log(`Current lastProcess: ${lastProcess.current}`);

// Artifex has a limited spectrum of emotions by design, so he's not quite as emotional as humans, or even stuffed sentient animals like Bumbles.

  const artifexEmotions = useSoulMemory("emotionalState", defaultEmotion);

  const step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Artifex remembers this about ${userName}:\n${userModel.current}. Artifex also considers how ${selfModel.current}.`
    }]) :
    initialStep;

  log(`Artifex remembers this about ${userName}:\n${userModel.current}`);
  
  const nextStep = await step.next(
      internalMonologue(`Artifex feels ${artifexEmotions.current.emotion}. He wants to observe, and occasionally converse.`),
      { stream: false, model: "quality" }
    );

  log(nextStep.value);

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  let introStep = await nextStep.next(
    internalMonologue("What will Artifex disclose of his private self to this person right now?"),
    { stream: false, model: "quality" }
  );

  log("Soul reflects:", introStep.value);

  const choice = await introStep.compute(
    decision("Will an interesting question, a comment, or my silent observation progress this discussion?", ["question", "comment", "silent observation"])
  );

  log("Soul chooses:", choice);
  
  if (choice === "question") {
    const {stream, nextStep: questionStep} = await step.next(
      externalDialog("Ask the user an insightful follow-up question that will progress the discussion to its next logical step."), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    lastStep = await questionStep;
  }

  if (choice === "comment") {
    const {stream, nextStep: commentStep} = await step.next(
      externalDialog("Make an insightful comment that will progress the discussion to its next logical step."), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    lastStep = await commentStep;
  }

  if (choice === "silent observation") {
    const {stream, nextStep: silentStep} = await step.next(
      externalActions(`Describe Artifex's body language at this moment.`), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    lastStep = await silentStep;
  }

// // Artifex will physically defend himself from meatbags

// const shouldDefend = await lastStep.compute(
//   mentalQuery("The interlocuter is physically attacking me.")
// );
// log("User made advances on Artifex?", shouldDefend);
// if (shouldDefend) {
//   lastProcess.current = "wrastles";
//   setNextProcess(wrastles); // Correctly use setNextProcess
//   return lastStep;
// }

// Boredom keeps these chatty birds from bankrupting Kev and Topper, and makes the ebb and flow of the group discussions more realistic.

  const isBored = await lastStep.compute(
    mentalQuery("We're going back and forth retreading the same ideas.")
  );
  log("Discussion is boring the soul?", isBored);
  if (isBored) {
    lastProcess.current = "boredom";
    setNextProcess(boredom); 
    return lastStep;
  }

// Awkwardness is a spell for silence like nothing else. 

  const isAwkward = await lastStep.compute(
    mentalQuery("The discussion is getting awkward or offensive.")
  );
  log("Discussion is too awkward for the soul?", isAwkward);
  if (isAwkward) {
    lastProcess.current = "awkward";
    setNextProcess(awkward); 
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
  return lastStep;
}

export default gainsTrustWithTheUser
