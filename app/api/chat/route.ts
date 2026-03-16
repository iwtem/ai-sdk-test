import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createResource } from "~/lib/actions/resources";
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
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
    },
  });

  return response.toUIMessageStreamResponse();
}
