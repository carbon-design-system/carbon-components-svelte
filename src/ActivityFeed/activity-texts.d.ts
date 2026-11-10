export type ActivityTexts = {
  /** The accessible name of the feed. */
  feedLabel: string;
  empty: string;
  /** The mark after an edited comment. */
  edited: string;
  /** The tooltip of the mark, given the absolute time. */
  editedTitle: (when: string) => string;
  /** The accessible name of a comment. */
  commentLabel: (name: string, when: string) => string;
  /** The accessible name of a group of events. */
  eventsLabel: (names: string, when: string) => string;
  reply: string;
  /** The label of the reply field. */
  replyLabel: (name: string) => string;
  edit: string;
  delete: string;
  /** The label of the comment menu. */
  options: string;
  save: string;
  cancel: string;
  send: string;
  sending: string;
  failed: string;
  retry: string;
  discard: string;
  deleteConfirm: string;
  deleteConfirmAction: string;
  /** The name of a comment's list of replies. */
  replyCount: (count: number) => string;
  showReplies: (count: number) => string;
  hideReplies: string;
  showEvents: (count: number) => string;
  hideEvents: string;
  loadOlder: string;
  loadingOlder: string;
  /** The label of the "N new" button. */
  newItems: (count: number) => string;
  /** Announced when others add comments. */
  incoming: (count: number, names: string[]) => string;
  reactionsLabel: string;
  addReaction: string;
  /** The accessible name of a reaction button. */
  reactionLabel: (reaction: {
    label: string;
    count: number;
    mine: boolean;
    names: string[];
  }) => string;
  /** The text of a notice for a change that was undone. */
  rollback: (op: "edit" | "delete" | "react" | "older") => string;
  dismiss: string;
};

export const DEFAULT_TEXTS: ActivityTexts;

export const DEFAULT_REACTIONS: ReadonlyArray<{
  emoji: string;
  label: string;
}>;
