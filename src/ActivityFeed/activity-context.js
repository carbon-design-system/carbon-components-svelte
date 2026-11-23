// @ts-check

/** Context key the feed shares its settings under with its rows. */
export const ACTIVITY_FEED_CONTEXT = "carbon:activity-feed";

/**
 * @typedef {object} ActivityHandlers
 * @property {(id: string, emoji: string) => void} react
 * @property {(id: string) => void} startEdit
 * @property {() => void} cancelEdit
 * @property {(id: string, body: string) => void} saveEdit
 * @property {(id: string) => void} askDelete
 * @property {() => void} cancelDelete
 * @property {(id: string) => void} confirmDelete
 * @property {(id: string) => void} startReply
 * @property {() => void} cancelReply
 * @property {(parentId: string, body: string) => void} submitReply
 * @property {(id: string) => void} retry
 * @property {(id: string) => void} discard
 * @property {(id: string) => void} toggleReplies
 * @property {(key: string) => void} toggleEvents
 */

/**
 * @typedef {object} ActivityConfig
 * @property {import("./activity-feed.js").ActivityUser | undefined} user
 * @property {(id: string) => string} nameOf
 * @property {number | undefined} now
 * @property {string | undefined} locale
 * @property {string | undefined} timeZone
 * @property {import("./activity-texts.js").ActivityTexts} texts
 * @property {ReadonlyArray<{ emoji: string; label: string }>} reactions
 * @property {ReadonlyArray<{ id: string | number; text: string; secondary?: string; insertText?: string; disabled?: boolean }>} mentionItems
 * @property {string | undefined} draftKey
 * @property {number} replyLimit
 * @property {number} eventGroupLimit
 * @property {ActivityHandlers} handlers
 */
