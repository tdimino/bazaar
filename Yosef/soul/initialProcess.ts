import { ChatMessageRoleEnum, externalDialog, internalMonologue, decision, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine";
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";
import { fetchUserContext } from "./util/fetchUserContext.js"; 

import { defaultEmotion } from "./subprocesses/emotionalSystem.js";

// Yosef defaults to ingratiating himself with other denizens

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

  // Yosef has emotions too

  const yosefEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Yosef remembers this about ${userName}:\n${userModel.current}. Yosef also considers ${selfModel.current}.`
    }]) :
    initialStep;

  log(`Yosef remembers this about ${userName}:\n${userModel.current}`);

  const nextStep = await step.next(
    internalMonologue(`Yosef feels ${yosefEmotions.current.emotion}. He's keen on understanding the environment, and being authentic in every interaction.`),
    { stream: false, model: "quality" }
  );

  let lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  let introStep = await nextStep.next(
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

export default gainsTrustWithTheUser



