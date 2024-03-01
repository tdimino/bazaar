import { MentalProcess, useActions, useRag } from "soul-engine";

const updateRag: MentalProcess = async ({ step: initialStep }) => {
  const { withRagContext } = useRag()
  const { log } = useActions()

  log("Syncing the working memory with knowledge from RAG")

  return withRagContext(initialStep)
}

export default updateRag
