// @ts-check
// Every string the feed shows or announces. Pass a partial `texts` object to
// replace some of them; the rest stay in English.

/** @param {number} count @param {string} one @param {string} other */
function plural(count, one, other) {
  return count === 1 ? one : other;
}

/**
 * @typedef {object} ActivityTexts
 * @property {string} feedLabel - The accessible name of the feed.
 * @property {string} empty
 * @property {string} edited - The mark after an edited comment.
 * @property {(when: string) => string} editedTitle - The tooltip of the mark, given the absolute time.
 * @property {(name: string, when: string) => string} commentLabel - The accessible name of a comment.
 * @property {(names: string, when: string) => string} eventsLabel - The accessible name of a group of events.
 * @property {string} reply
 * @property {(name: string) => string} replyLabel - The label of the reply field.
 * @property {string} edit
 * @property {string} delete
 * @property {string} options - The label of the comment menu.
 * @property {string} save
 * @property {string} cancel
 * @property {string} send
 * @property {string} sending
 * @property {string} failed
 * @property {string} retry
 * @property {string} discard
 * @property {string} deleteConfirm
 * @property {string} deleteConfirmAction
 * @property {(count: number) => string} replyCount - The name of a comment's list of replies.
 * @property {(count: number) => string} showReplies
 * @property {string} hideReplies
 * @property {(count: number) => string} showEvents
 * @property {string} hideEvents
 * @property {string} loadOlder
 * @property {string} loadingOlder
 * @property {(count: number) => string} newItems - The label of the "N new" button.
 * @property {(count: number, names: string[]) => string} incoming - Announced when others add comments.
 * @property {string} reactionsLabel
 * @property {string} addReaction
 * @property {(reaction: { label: string; count: number; mine: boolean; names: string[] }) => string} reactionLabel - The accessible name of a reaction button.
 * @property {(op: "edit" | "delete" | "react" | "older") => string} rollback - The text of a notice for a change that was undone.
 * @property {string} dismiss
 */

/** @type {ActivityTexts} */
export const DEFAULT_TEXTS = {
  feedLabel: "Activity",
  empty: "No activity yet",
  edited: "edited",
  editedTitle: (when) => `Edited ${when}`,
  commentLabel: (name, when) => `Comment by ${name}, ${when}`,
  eventsLabel: (names, when) => `Activity by ${names}, ${when}`,
  reply: "Reply",
  replyLabel: (name) => `Reply to ${name}`,
  edit: "Edit",
  delete: "Delete",
  options: "Comment options",
  save: "Save",
  cancel: "Cancel",
  send: "Comment",
  sending: "Sending",
  failed: "Not sent",
  retry: "Retry",
  discard: "Discard",
  deleteConfirm: "Delete this comment?",
  deleteConfirmAction: "Delete",
  replyCount: (count) => `${count} ${plural(count, "reply", "replies")}`,
  showReplies: (count) =>
    `Show ${count} earlier ${plural(count, "reply", "replies")}`,
  hideReplies: "Hide earlier replies",
  showEvents: (count) => `Show ${count} more`,
  hideEvents: "Show less",
  loadOlder: "Load older activity",
  loadingOlder: "Loading older activity",
  newItems: (count) => `${count} new ${plural(count, "comment", "comments")}`,
  incoming: (count, names) =>
    count === 1 && names.length === 1
      ? `${names[0]} commented`
      : `${count} new ${plural(count, "comment", "comments")}`,
  reactionsLabel: "Reactions",
  addReaction: "Add reaction",
  reactionLabel: ({ label, count, mine, names }) => {
    const who = mine ? ["You", ...names] : names;
    const list =
      who.length > 2
        ? `${who.slice(0, 2).join(", ")} and ${who.length - 2} ${plural(who.length - 2, "other", "others")}`
        : who.join(" and ");
    return `${label}, ${count} ${plural(count, "reaction", "reactions")}${list ? `: ${list}` : ""}`;
  },
  rollback: (op) =>
    ({
      edit: "Your edit was not saved and was undone.",
      delete: "The comment was not deleted.",
      react: "Your reaction was not saved and was undone.",
      older: "Older activity could not be loaded.",
    })[op],
  dismiss: "Dismiss",
};

/**
 * @type {ReadonlyArray<{ emoji: string; label: string }>}
 */
export const DEFAULT_REACTIONS = [
  { emoji: "\u{1F44D}", label: "Thumbs up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "\u{1F389}", label: "Hooray" },
  { emoji: "\u{1F604}", label: "Smile" },
  { emoji: "\u{1F615}", label: "Confused" },
  { emoji: "\u{1F440}", label: "Eyes" },
];
