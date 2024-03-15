import { CortexStep, ChatMessageRoleEnum } from "socialagi"
import { html } from "common-tags";

const stripResponseBoilerPlate = ({ entityName }: CortexStep<any>, _verb: string, response: string) => {
    // sometimes the LLM will respond with something like "Bogus said with a sinister smile: "I'm going to eat you!" (adding more words)
    // so we just strip any of those
    let strippedResponse = response.replace(new RegExp(`${entityName}.*?:`, "i"), "").trim();
    // get rid of the quotes
    strippedResponse = strippedResponse.replace(/^["']|["']$/g, '').trim();
    return strippedResponse
  }

const boilerPlateStreamProcessor = async ({ entityName }: CortexStep<any>, stream: AsyncIterable<string>): Promise<AsyncIterable<string>> => {
    const prefix = new RegExp(`^${entityName}.*?:\\s*["']*`, "i")
    const suffix = /["']$/
  
    let isStreaming = !prefix
    let prefixMatched = !prefix
    let buffer = ""
    const isStreamingBuffer: string[] = []
  
    const processedStream = (async function* () {
      for await (const chunk of stream) {
        // if we are already streaming, then we need to look out for a suffix
        // we keep the last 2 chunks in the buffer to check after the stream is finished
        // othwerwise we keep streaming
        if (isStreaming) {
          if (!suffix) {
            yield chunk
            continue;
          }
          isStreamingBuffer.push(chunk)
          if (isStreamingBuffer.length > 2) {
            yield isStreamingBuffer.shift() as string
          }
          continue;
        }
  
        // if we're not streaming, then keep looking for the prefix, and allow one *more* chunk
        // after detecting a hit on the prefix to come in, in case the prefix has some optional ending
        // characters.
        buffer += chunk;
        if (prefix && prefix.test(buffer)) {
          if (prefixMatched) {
            isStreaming = true;
  
            buffer = buffer.replace(prefix, '');
            yield buffer; // yield everything after the prefix
            buffer = ''; // clear the buffer
            continue
          }
          prefixMatched = true
        }
      }
      buffer = [buffer, ...isStreamingBuffer].join('')
      // if we ended before switching on streaming, then we haven't stripped the prefix yet.
      if (!isStreaming && prefix) {
        buffer = buffer.replace(prefix, '');
      }
      if (buffer.length > 0) {
        // if there was some buffer left over, then we need to check if there was a suffix
        // and remove that from the last part of the stream.
        if (suffix) {
          buffer = buffer.replace(suffix, '');
          yield buffer; // yield everything before the suffix
          return
        }
        // if there was no suffix, then just yield what's left.
        yield buffer; // yield the last part of the buffer if anything is left
      }
    })();
    return processedStream;
  }
  
  
  /**
   * Will function like externalDialog, but allow the soul to use astericks to denote physical movements.
   */
  
  export const externalActions = (extraInstructions?: string, verb = "said") => {
    return () => {
      return {
        command: ({ entityName: name }: CortexStep<any>) => {
          return html`
            Model the mind of ${name}.
    
            ## Instructions
            * Include ONLY actions (for example, non-verbal items like *John Smiles* or *John Nods*, etc).
            * DO NOT include internal thoughts (for example, do NOT respond with John thought: "...").
            
            ${extraInstructions}
  
            Please reply with the next action from ${name}. Use the format '${name} ${verb}: "..."'
          `;
        },
        commandRole: ChatMessageRoleEnum.System,
        streamProcessor: boilerPlateStreamProcessor,
        process: (step: CortexStep<any>, response: string) => {
          return {
            value: response,
            memories: [{
              role: ChatMessageRoleEnum.Assistant,
              content: `${step.entityName} ${verb}: "${response}"`
            }],
          }
        }
      }
    }
  }
