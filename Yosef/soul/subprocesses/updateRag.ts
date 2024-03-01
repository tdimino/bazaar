import { MentalProcess, useActions, useRag } from "soul-engine";

const updateRag: MentalProcess = async ({ step: initialStep }) => {
  const { withRagContext } = useRag("example-raggy-knows-open-soul")
  const { log } = useActions()

  log("updating the working memory with knowledge from RAG")

  return withRagContext(initialStep)
}

export default updateRag
