"use client";

import { useChat } from "@ai-sdk/react";
import { useElementSize } from "@mantine/hooks";
import { MessageSquareIcon } from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "~/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "~/components/ai-elements/message";
import type { PromptInputMessage } from "~/components/ai-elements/prompt-input";
import { ChatPromptInput } from "~/components/chat-prompt-input";

const models = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus" },
];

const promptInputBottom = 24;

export default function Chat() {
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const { messages, status, sendMessage } = useChat();
  const { ref: promptInputRef, height: promptInputHeight } = useElementSize();
  const scrollPaddingBottom = promptInputBottom * 2 + promptInputHeight;

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: useWebSearch,
        },
      },
    );
    setText("");
  };

  return (
    <div className="flex flex-col size-full">
      <Conversation className="relative size-full min-h-0">
        <ConversationContent
          className="w-full max-w-2xl mx-auto"
          style={{ paddingBottom: scrollPaddingBottom }}
        >
          {messages.length > 0 ? (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <div key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <MessageResponse key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </div>
              </Message>
            ))
          ) : (
            <ConversationEmptyState
              title="Start a conversation"
              description="Messages will appear here as the conversation progresses."
              icon={<MessageSquareIcon className="size-6" />}
            />
          )}
        </ConversationContent>
        <ConversationScrollButton style={{ bottom: scrollPaddingBottom }} />

        <ChatPromptInput
          ref={promptInputRef}
          bottom={promptInputBottom}
          model={model}
          models={models}
          onModelChange={setModel}
          onSubmit={handleSubmit}
          onTextChange={setText}
          onWebSearchChange={setUseWebSearch}
          status={status}
          text={text}
          useWebSearch={useWebSearch}
        />
      </Conversation>
    </div>
  );
}
