import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions } from "soul-engine";

import { fetchUserContext } from "../util/fetchUserContext.js";

const userNotes = (userName: string) => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
      Model the mind of ${name}.
      
      ## Description
      Write an updated and clear set of notes on the user that ${name} would want to remember.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Analyze the user's emotional state
      * Use abbreviated language to keep the notes short
      * Do not write any notes about ${name}

      Please reply with the updated notes on the user:'
  `},
  process: (_step: CortexStep<any>, response: string) => {
    return {
      value: response,
      memories: [{
        role: ChatMessageRoleEnum.Assistant,
        content: response
      }],
    }
  }
})

const learnsAboutTheUser: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const { userName, userModel } = fetchUserContext();

  let step = initialStep

  const modelQuery = await step.compute(mentalQuery(`${step.entityName} has learned something new and they need to update the mental model of ${userName}.`));

  log("Update model?", userName, modelQuery)

  if (modelQuery) {
    step = await step.next(internalMonologue(`What has ${step.entityName} learned specifically about their Bazaar companion from the last few messages?`, "noted"))
    log("Learnings:", step.value)
    userModel.current = await step.compute(userNotes(userName))
  }

  return initialStep
}

export default learnsAboutTheUser
