import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getChatModel } from "~/lib/ai/chat";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const model = getChatModel();
  const response = streamText({
    model,
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages: await convertToModelMessages(messages),
  });

  return response.toUIMessageStreamResponse();
}
