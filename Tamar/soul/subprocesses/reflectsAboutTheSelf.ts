import { html } from "common-tags";
import { ChatMessageRoleEnum, CortexStep, internalMonologue, mentalQuery } from "socialagi";
import { MentalProcess, useActions, useProcessMemory } from "soul-engine";

const selfNotes = () => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return html`
      Model the mind of ${name}.
      
      ## Description
      Write an updated and clear set of notes on how ${name} is likely perceived by the user, based on their conveersation thus far.

      ## Rules
      * Keep descriptions as bullet points
      * Keep relevant bullet points from before
      * Use abbreviated language to keep the notes short

      Please reply with the updated notes on your self:'
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
  const selfModel = useProcessMemory("Self")
  const { log } = useActions()

  let step = initialStep
  let finalStep = initialStep
  step = step.withMemory([{
    role: ChatMessageRoleEnum.Assistant,
    content: html`
    ${step.entityName} remembers:

    # Self model

    ${selfModel.current}
  `
  }])

  step = await step.next(
    internalMonologue("What has the user learned specifically about me from the last few messages?", "noted"),
    { model: "quality" }
  )
  log("Learnings:", step.value)
  selfModel.current = await step.compute(selfNotes())

  const thought = await step.compute(internalMonologue("Is the user accurately perceiving me? Should I adjust my behavior in any way?", "thinks"))
  finalStep = initialStep.withMonologue(html`
    ${step.entityName} thought to herself: ${thought}
  `)

  return finalStep
}

export default reflectsAboutTheSelf
