import { ChatMessageRoleEnum, spokenDialog, internalMonologue, decision, mentalQuery } from "socialagi";
import { MentalProcess, useActions, usePerceptions, useSoulMemory, useProcessManager } from "soul-engine";
import boredom from "./mentalProcesses/boredom.js";
import awkward from "./mentalProcesses/awkward.js";

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

  const discordMessage = invokingPerception?._metadata?.discordMessage as any;
  const userName = discordMessage?.username || "Anonymous";
  const userModel = useSoulMemory(userName, "");

  //Thiago's "lastProcess" trick to 'set' the mentalProcess in memory

  const lastProcess = useSoulMemory("lastProcess", "");
  lastProcess.current = "initialProcess";
  log(`Current lastProcess: ${lastProcess.current}`);

  // Yosef has emotions too

  const yosefEmotions = useSoulMemory("emotionalState", defaultEmotion);

  let step = userModel.current ?
    initialStep.withMemory([{
      role: ChatMessageRoleEnum.Assistant,
      content: `Yosef remembers this about ${userName}:\n${userModel.current}`
    }]) :
    initialStep;

  log(`Yosef remembers this about ${userName}:\n${userModel.current}`);

  let lastStep = initialStep;

  await initialStep.next(
    internalMonologue("What will I disclose of my inner world to this person right now?")
  );

  const { stream, nextStep } = await initialStep.next(
    spokenDialog(`Yosef feels ${yosefEmotions.current.emotion}. He's keen on understanding the envirnment, and being authentic in every interaction'.`),
    { stream: true, model: "quality" }
  );

  dispatch({
    action: "says",
    content: stream,
    _metadata: {
      helloWorld: "works!",
    }
  });

  lastStep = initialStep.withMemory((await nextStep).memories.slice(-1));

  // Inspired by Kevin's "Alfred", this offers the soul a way to navigate discussions more organically. 

  const choice = await initialStep.compute(
    decision("Will an interesting question, comment, or my silent observation move this discussion along more?", ["question", "comment", "quiet observation"])
  );

  log("Soul chooses:", choice);
  
  if (choice === "question") {
  
    let step = await initialStep.next(spokenDialog("Ask the user a follow-up question that progresses the discussion along."), 
    { stream: true, model: "quality" }
  );
  speak(stream);

  }

  if (choice === "comment") {
  
    let step = await initialStep.next(spokenDialog("Make a comment that progresses the discussion along."), 
    { stream: true, model: "quality" }
  );
  speak(stream);

  }

  if (choice === "silent observation") {
    lastStep = initialStep;
  }
    

  // Boredom keeps these chatty birds from going in circles.

  const isBored = await lastStep.compute(
    mentalQuery("The discussion is getting boring or repeating itself.")
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



