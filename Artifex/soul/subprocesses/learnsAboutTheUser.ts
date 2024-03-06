import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessMemory } from "soul-engine";

const userNotes = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
      Model the mind of ${name}.
      
      ## Description
      Write an updated and clear set of notes on the interlocutor that ${name} would want to remember.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Use abbreviated language to keep the notes short
      * Do not write any notes about ${name}

      Please reply with the updated notes on the interlocutor:'
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
  const userModel = useProcessMemory("Unknown interlocutor")
  const { log } = useActions()

  let step = initialStep
  let finalStep = initialStep
  step = step.withMemory([{
    role: ChatMessageRoleEnum.Assistant,
    content: html`
    ${step.entityName} remembers:

    # User model

    ${userModel.current}
  `
  }])

  step = await step.next(
    internalMonologue("What have I learned specifically about the interlocutor from the last few messages?", "noted"),
    { model: "quality" }
  )
  log("Learnings:", step.value)
  userModel.current = await step.compute(userNotes())

  const thought = await step.compute(internalMonologue("What should I think to myself to change my behavior? Start with 'I need...'", "thinks"))
  finalStep = initialStep.withMonologue(html`
    ${step.entityName} thought to himself: ${thought}
  `)

  return finalStep
}

export default learnsAboutTheUser
