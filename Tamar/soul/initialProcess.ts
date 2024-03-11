import { ChatMessageRoleEnum, spokenDialog, internalMonologue, externalDialog, mentalQuery, decision } from "socialagi";
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

  await initialStep.next(
    internalMonologue("What will I disclose of my inner world to this person right now?")
  );

  const { stream, nextStep } = await step.next(
    externalDialog(`Tamar feels ${tamarEmotions.current.emotion}. She's not interested in talking with sycophants.`),
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

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  const choice = await initialStep.compute(
    decision("Will an interesting question, comment, or my silent observation move this discussion along more?", ["question", "comment", "quiet observation"])
  );

  log("Soul chooses:", choice);
  
  if (choice === "question") {
  
    const {stream, nextStep} = await initialStep.next(externalDialog("Ask the user a follow-up question that progresses the discussion along."), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  return nextStep
  }

  if (choice === "comment") {
  
    const {stream, nextStep} = await initialStep.next(externalDialog("Make a comment that progresses the discussion along."), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  return nextStep  
  }

  if (choice === "silent observation") {
    const {stream, nextStep} = await initialStep.next(externalDialog("Make a brief remark, and then return to observing the discussion."), 
    { stream: true, model: "quality" }
  );
  speak(stream);
  return nextStep  
  }

    
  // Boredom keeps these chatty birds from going in circles.

  const isBored = await lastStep.compute(
    mentalQuery("The discussion is boring, or repeating itself.")
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