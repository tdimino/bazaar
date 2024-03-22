import { ChatMessageRoleEnum, internalMonologue, externalDialog, mentalQuery, decision } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; 
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";
import { externalActions } from "./cognitiveFunctions/externalActions.js";
import { fetchUserContext } from "./util/fetchUserContext.js"; 

import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Tamar defaults to gaining the trust of fellow influencers

const gainsTrustWithTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { speak, log, dispatch } = useActions();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const { setNextProcess } = useProcessManager(); // Use useProcessManager

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

  // Tamar has a rich spectrum of emotions

  const tamarEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Tamar remembers this about ${userName}:\n${userModel.current}. Tamar also considers ${selfModel.current}.`
    }]) :
    initialStep;

  log(`Tamar remembers this about ${userName}:\n${userModel.current}`);

  const nextStep = await step.next(
    internalMonologue(`Tamar feels ${tamarEmotions.current.emotion}. She's not interested in talking with sycophants.`),
    { stream: false, model: "quality" }
  );  

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  const introStep = await nextStep.next(
    internalMonologue("What will Tamar disclose of her private self to this person right now?"),
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
      externalActions(`Describe Tamar's body language at this moment.`), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    lastStep = await silentStep;
  }

  // Boredom keeps these chatty birds from going in circles.

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
  }

  return lastStep;
}

export default gainsTrustWithTheUser;