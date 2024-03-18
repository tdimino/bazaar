import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions } from "soul-engine";

import { fetchUserContext } from "../util/fetchUserContext.js";

const selfNotes = (userName: string) => () => ({
  command: ({ entityName }: CortexStep) => {
    return html`
      ## Description
      Write an updated and clear set of notes on how ${entityName} is probably being perceived by the user, based on their conversation thus far.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Analyze ${entityName}'s perceived emotional state by the user
      * Use abbreviated language to keep the notes short

      Please reply with the updated notes on your self.
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

const reflectsAboutTheSelf: MentalProcess = async ({ step: initialStep }) => {
  const { log } = useActions()
  const { userName, selfModel } = fetchUserContext();

  let step = initialStep

    const modelQuery = await step.compute(mentalQuery(`${userName} has learned something new about ${step.entityName} and they need to update their internal model of ${step.entityName}.`));

    log("Update model?", userName, modelQuery)

    if (modelQuery) {
      step = await step.next(internalMonologue(`What has ${userName} learned specifically about ${step.entityName} from the last few messages?`, "noted"))
      log("Learnings:", step.value)
      selfModel.current = await step.compute(selfNotes(userName))
    }

  // no memories on the users for now
  return initialStep
}

export default reflectsAboutTheSelf



