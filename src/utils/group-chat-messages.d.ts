export type ChatDividerItem = {
  type: "divider";
  key: string;
  time: Date;
  /** "Today", "Yesterday", a date, or the time after a pause the same day. */
  label: string;
};

export type ChatMessageItem<Message> = {
  type: "message";
  key: string | number;
  message: Message;
  /** The previous message is from the same author, within `groupGap`. */
  continued: boolean;
  /** The message ends its group: the place for its time and status. */
  last: boolean;
};

/**
 * Lay out a conversation for ChatLog: mark each message `continued` when it
 * follows one from the same author within `groupGap` (default five
 * minutes), and `last` when it ends its group, and insert a divider before a
 * new day or after a pause longer than `dividerGap` (default an hour).
 * Labels read "Today", "Yesterday", a date, or the time after a pause, in
 * `locale`; pass `label` to write your own.
 */
export function groupChatMessages<
  Message extends {
    time: Date | number | string;
    author?: string;
    from?: string;
    id?: string | number;
  },
>(
  messages: ReadonlyArray<Message>,
  options?: {
    /** Milliseconds between messages that still group them. */
    groupGap?: number;
    /** Milliseconds of silence after which a divider shows the time. */
    dividerGap?: number;
    locale?: string;
    /** The current time, for "Today" and "Yesterday". */
    now?: Date | number;
    /** Who sent a message. Defaults to `author`, then `from`. */
    author?: (message: Message) => unknown;
    label?: (time: Date, context: { newDay: boolean }) => string;
  },
): Array<ChatDividerItem | ChatMessageItem<Message>>;
