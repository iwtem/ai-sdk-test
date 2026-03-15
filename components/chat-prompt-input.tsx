"use client";

import { GlobeIcon } from "lucide-react";
import type { ComponentProps, Ref } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "~/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "~/components/ai-elements/prompt-input";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

export type ChatPromptInputModel = { id: string; name: string };

export type ChatPromptInputProps = {
  bottom?: number;
  model: string;
  models: ChatPromptInputModel[];
  onModelChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  onTextChange: (value: string) => void;
  onWebSearchChange: (value: boolean) => void;
  ref?: Ref<HTMLDivElement>;
  status: ComponentProps<typeof PromptInputSubmit>["status"];
  text: string;
  useWebSearch: boolean;
};

export function ChatPromptInput({
  bottom = 24,
  model,
  models,
  onModelChange,
  onSubmit,
  onTextChange,
  onWebSearchChange,
  ref,
  status,
  text,
  useWebSearch,
}: ChatPromptInputProps) {
  return (
    <div
      ref={ref}
      className="my-4 w-full max-w-2xl mx-auto sticky bg-white"
      style={{ bottom }}
    >
      <PromptInput autoFocus onSubmit={onSubmit} globalDrop multiple>
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea onChange={(e) => onTextChange(e.target.value)} value={text} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputButton
              onClick={() => onWebSearchChange(!useWebSearch)}
              tooltip={{ content: "Search the web", shortcut: "⌘K" }}
              variant={useWebSearch ? "default" : "ghost"}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
            <PromptInputSelect onValueChange={onModelChange} value={model}>
              <PromptInputSelectTrigger>
                <PromptInputSelectValue />
              </PromptInputSelectTrigger>
              <PromptInputSelectContent>
                {models.map((m) => (
                  <PromptInputSelectItem key={m.id} value={m.id}>
                    {m.name}
                  </PromptInputSelectItem>
                ))}
              </PromptInputSelectContent>
            </PromptInputSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={!text && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
