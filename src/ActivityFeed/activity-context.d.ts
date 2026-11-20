import type { ActivityUser } from "./activity-feed.js";
import type { ActivityTexts } from "./activity-texts.js";

/** Context key the feed shares its settings under with its rows. */
export const ACTIVITY_FEED_CONTEXT: string;

export type ActivityHandlers = {
  react: (id: string, emoji: string) => void;
  startEdit: (id: string) => void;
  cancelEdit: () => void;
  saveEdit: (id: string, body: string) => void;
  askDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: (id: string) => void;
  startReply: (id: string) => void;
  cancelReply: () => void;
  submitReply: (parentId: string, body: string) => void;
  retry: (id: string) => void;
  discard: (id: string) => void;
  toggleReplies: (id: string) => void;
  toggleEvents: (key: string) => void;
};

export type ActivityConfig = {
  user: ActivityUser | undefined;
  nameOf: (id: string) => string;
  now: number | undefined;
  locale: string | undefined;
  timeZone: string | undefined;
  texts: ActivityTexts;
  reactions: ReadonlyArray<{ emoji: string; label: string }>;
  mentionItems: ReadonlyArray<{
    id: string | number;
    text: string;
    secondary?: string;
    insertText?: string;
    disabled?: boolean;
  }>;
  draftKey: string | undefined;
  replyLimit: number;
  eventGroupLimit: number;
  handlers: ActivityHandlers;
};
