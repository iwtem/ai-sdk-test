import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getChatModel } from "~/lib/ai/chat";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const model = getChatModel();
  const response = streamText({
    model,
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });

  return response.toUIMessageStreamResponse();
}
