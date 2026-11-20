// @ts-check
// Apply the result of a tab-completion function to a line of input.

import { stripControls } from "./terminal-text.js";

const WHITESPACE = /\s/;
/** A candidate that the user keeps typing after. */
const OPEN_ENDED = /[/=]$/;

/** Most candidates read from one result. */
const MAX_CANDIDATES = 1000;

/**
 * A completion function returns the candidates for the word at the cursor, or
 * an object that also says which part of the line they replace.
 * @typedef {string[] | { candidates: string[], from?: number, to?: number }} TerminalCompletion
 */

/**
 * Where the word at the cursor starts.
 * @param {string} value
 * @param {number} cursor
 * @returns {number}
 */
export function wordStart(value, cursor) {
  let index = Math.min(cursor, value.length);
  while (index > 0 && !WHITESPACE.test(value[index - 1])) index--;
  return index;
}

/**
 * The longest string every candidate starts with.
 * @param {string[]} candidates
 * @returns {string}
 */
export function commonPrefix(candidates) {
  if (candidates.length === 0) return "";
  let prefix = candidates[0];
  for (const candidate of candidates) {
    let end = 0;
    const limit = Math.min(prefix.length, candidate.length);
    while (end < limit && prefix[end] === candidate[end]) end++;
    prefix = prefix.slice(0, end);
    if (prefix === "") break;
  }
  return prefix;
}

/**
 * Apply a completion to a line.
 *
 * One candidate replaces the word and adds a space, unless it ends in `/` or
 * `=`, which the user keeps typing after. Several candidates extend the word
 * to what they share. When they share no more than the word already has, the
 * line is left alone and the candidates are returned to be listed.
 *
 * @param {string} value
 * @param {number} cursor
 * @param {TerminalCompletion | null | undefined} result
 * @returns {{ value: string, cursor: number, list: string[] }} `list` is
 * empty unless the candidates are to be shown.
 */
export function applyCompletion(value, cursor, result) {
  const unchanged = { value, cursor, list: /** @type {string[]} */ ([]) };
  const raw = Array.isArray(result) ? result : result?.candidates;
  if (!Array.isArray(raw)) return unchanged;

  const candidates = [
    ...new Set(
      raw
        .slice(0, MAX_CANDIDATES)
        .map((candidate) => stripControls(String(candidate)))
        .filter((candidate) => candidate !== ""),
    ),
  ];
  if (candidates.length === 0) return unchanged;

  const at = Math.min(Math.max(0, cursor), value.length);
  const range = Array.isArray(result) ? undefined : result;
  const from = Math.min(Math.max(0, range?.from ?? wordStart(value, at)), at);
  const to = Math.min(Math.max(from, range?.to ?? at), value.length);
  const typed = value.slice(from, to);

  /** @type {string} */
  let replacement;
  if (candidates.length === 1) {
    replacement = OPEN_ENDED.test(candidates[0])
      ? candidates[0]
      : `${candidates[0]} `;
  } else {
    replacement = commonPrefix(candidates);
    if (replacement.length <= typed.length) {
      return { value, cursor, list: candidates };
    }
  }
  return {
    value: value.slice(0, from) + replacement + value.slice(to),
    cursor: from + replacement.length,
    list: [],
  };
}
