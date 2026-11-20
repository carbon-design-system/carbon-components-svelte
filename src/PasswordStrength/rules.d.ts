import type { Blocklist } from "./blocklist.js";

export interface RuleContext {
  /** Strings the password must not contain. */
  userInputs: string[];
  blocklist: Blocklist;
}

export interface PasswordRequirement {
  /** Stable key. */
  id: string;
  /** What the person sees, for example "At least 12 characters". */
  text: string;
  test: (password: string, context: RuleContext) => boolean;
  /** Return `false` to leave the rule out, for example when there is no email to compare with. */
  when?: (context: RuleContext) => boolean;
}

export interface RequirementResult {
  id: string;
  text: string;
  met: boolean;
}

export function minLength(min?: number, text?: string): PasswordRequirement;
export function hasNumber(text?: string): PasswordRequirement;
export function hasSymbol(text?: string): PasswordRequirement;
/** Reject whitespace. NIST says to allow spaces in a password. */
export function noSpaces(text?: string): PasswordRequirement;
export function notContainingUserInput(text?: string): PasswordRequirement;
export function notCommon(text?: string): PasswordRequirement;
/** Require the password to equal another, for a confirm field. */
export function matches(other: string, text?: string): PasswordRequirement;

export const passwordRules: {
  minLength: typeof minLength;
  hasNumber: typeof hasNumber;
  hasSymbol: typeof hasSymbol;
  noSpaces: typeof noSpaces;
  notContainingUserInput: typeof notContainingUserInput;
  notCommon: typeof notCommon;
  matches: typeof matches;
};

/** NIST SP 800-63B: length and a blocklist, no composition rules. */
export function defaultRequirements(): PasswordRequirement[];

/** Run requirements against a password. An empty password meets none. */
export function checkRequirements(
  password: string,
  requirements: PasswordRequirement[],
  options?: {
    userInputs?: string[];
    blocklist?: Blocklist | Iterable<string>;
  },
): { results: RequirementResult[]; unmet: RequirementResult[]; valid: boolean };
