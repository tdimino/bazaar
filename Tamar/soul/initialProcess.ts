import { ChatMessageRoleEnum, internalMonologue, externalDialog, mentalQuery, decision } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine"; 
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";

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

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";
  const userModel = useSoulMemory(userName, "");

  //Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "initialProcess";
  log(`Current lastProcess: ${lastProcess.current}`);

  // Tamar has a rich spectrum of emotions

  const tamarEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Tamar feels ${tamarEmotions.current.emotion}. She's not interested in talking with sycophants.`
    }]) :
    initialStep;

  log(`Tamar remembers this about ${userName}:\n${userModel.current}`);

  let nextStep = await initialStep.next(
    internalMonologue(`Tamar feels ${tamarEmotions.current.emotion}. She's not interested in talking with sycophants.`),
    { stream: false, model: "quality" }
  );  

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  nextStep = await nextStep.next(
    internalMonologue("What will Tamar disclose of her private self to this person right now?"),
    { stream: false, model: "quality" }
  );

  log("Soul reflects:", nextStep.value);

  const choice = await nextStep.compute(
    decision("Will an interesting question, a comment, or my silent observation progress this discussion?", ["question", "comment", "silent observation"])
  );

  log("Soul chooses:", choice);
  
  if (choice === "question") {
    const {stream, nextStep: updatedNextStep} = await nextStep.next(
      externalDialog("Ask the user an insightful follow-up question that will progress the discussion to its next logical step."), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    nextStep = await updatedNextStep;
  }

  if (choice === "comment") {
    const {stream, nextStep: updatedNextStep} = await nextStep.next(
      externalDialog("Make an insightful comment that will progress the discussion to its next logical step."), 
      { stream: true, model: "quality" }
    );
    speak(stream);
    nextStep = await updatedNextStep;
  }

  if (choice === "silent observation") {
  }

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

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