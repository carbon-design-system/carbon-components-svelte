import type { Blocklist } from "./blocklist.js";

export type PasswordWarning =
  | "top10"
  | "top100"
  | "common"
  | "personal"
  | "repeatChar"
  | "repeatPattern"
  | "sequence"
  | "keyboard"
  | "date";

export type PasswordSuggestion =
  | "addWords"
  | "longer"
  | "avoidPersonal"
  | "avoidRepeats"
  | "avoidSequences"
  | "avoidKeyboard"
  | "avoidDates"
  | "predictable"
  | "capsNoHelp";

export interface PasswordFeedback {
  /** A key of `feedbackTexts`, or `null`. */
  warning: PasswordWarning | (string & {}) | null;
  suggestions: (PasswordSuggestion | (string & {}))[];
}

export type CrackTimeBucket =
  | "instantly"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "months"
  | "years"
  | "centuries";

export interface CrackTime {
  seconds: number;
  bucket: CrackTimeBucket;
}

export interface PasswordPattern {
  pattern:
    | "dictionary"
    | "user"
    | "repeat"
    | "sequence"
    | "keyboard"
    | "date"
    | "year";
  /** Index of the first character, in code points. */
  start: number;
  /** Index of the last character, inclusive. */
  end: number;
  bits: number;
}

export type PasswordLevel = "empty" | "weak" | "fair" | "good" | "strong";

export interface PasswordEstimate {
  /** As zxcvbn: 0 and 1 are weak, 2 fair, 3 good, 4 strong. */
  score: 0 | 1 | 2 | 3 | 4;
  level: PasswordLevel;
  /** log2 of the estimated guesses. */
  bits: number;
  guesses: number;
  crackTimes: {
    onlineThrottled: CrackTime;
    onlineUnthrottled: CrackTime;
    offlineSlow: CrackTime;
    offlineFast: CrackTime;
  };
  feedback: PasswordFeedback;
  /** What the password was split into. Holds positions, never the text. */
  patterns: PasswordPattern[];
  length: number;
}

export interface EstimateOptions {
  /** Strings to penalize: name, email, company. */
  userInputs?: string[];
  /** Replaces the built-in top 1,000. */
  blocklist?: Blocklist | Iterable<string>;
}

/** The longest password looked at. Longer ones are estimated by their first part. */
export const MAX_ESTIMATE_LENGTH: number;

/** The built-in top-1,000 blocklist, decoded on first use. */
export function getDefaultBlocklist(): Blocklist;

/** Split user-supplied strings into the words worth penalizing. */
export function userInputTokens(inputs: string[] | undefined): string[];

/** Whether a password is on the blocklist, allowing a few trailing characters and letter substitutions. */
export function isCommonPassword(
  password: string,
  blocklist?: Blocklist | Iterable<string> | null,
): boolean;

export function levelFromScore(score: number): Exclude<PasswordLevel, "empty">;

/**
 * Estimate how long a password would take to guess. Pure and synchronous.
 * The result never holds the password or any piece of it.
 */
export function estimatePasswordStrength(
  password: string,
  options?: EstimateOptions,
): PasswordEstimate;

/** English feedback text, by the codes in `PasswordFeedback`. */
export const DEFAULT_FEEDBACK_TEXTS: Record<string, string>;
