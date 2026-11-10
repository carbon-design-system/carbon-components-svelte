export type ActivityBodyRun =
  | { type: "text"; text: string; strong?: boolean; em?: boolean }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "mention"; text: string; id: string; trigger: string }
  | { type: "br" };

export type ActivityBodyBlock =
  | { type: "paragraph"; runs: ActivityBodyRun[] }
  | { type: "quote"; runs: ActivityBodyRun[] }
  | { type: "list"; items: ActivityBodyRun[][] }
  | { type: "code"; text: string };

/** Longer bodies are cut here, so parsing stays linear on hostile input. */
export const MAX_BODY_LENGTH: number;

/**
 * The normalized URL when it is an absolute `http`, `https` or `mailto`
 * link, otherwise `undefined`.
 */
export function safeUrl(url: string): string | undefined;

/** Parse a comment body into blocks of runs. Nothing in it is HTML. */
export function parseActivityBody(body: string): ActivityBodyBlock[];

/** The text a reader gets from a body: mention tokens become `@Name`. */
export function activityBodyToText(body: string): string;
