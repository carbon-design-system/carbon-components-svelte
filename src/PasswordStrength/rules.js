// @ts-check
// Password requirements: hard rules that can block a submit. Strength is
// advice; these are policy. The factories below build the common rules, and
// any `{ id, text, test }` object works too.

import { toBlocklist } from "./blocklist.js";
import {
  getDefaultBlocklist,
  isCommonPassword,
  userInputTokens,
} from "./estimate.js";

/**
 * @typedef {object} RuleContext
 * @property {string[]} userInputs - Strings the password must not contain.
 * @property {import("./blocklist.js").Blocklist} blocklist
 *
 * @typedef {object} PasswordRequirement
 * @property {string} id - Stable key.
 * @property {string} text - What the person sees, for example "At least 12 characters".
 * @property {(password: string, context: RuleContext) => boolean} test
 * @property {(context: RuleContext) => boolean} [when] - Return `false` to leave the rule out, for example when there is no email to compare with.
 *
 * @typedef {object} RequirementResult
 * @property {string} id
 * @property {string} text
 * @property {boolean} met
 */

const DIGIT = /\p{Nd}/u;
const SYMBOL = /[^\p{L}\p{N}\p{Z}\p{C}]/u;
const WHITESPACE = /\s/u;

/**
 * Count Unicode code points, as NIST SP 800-63B does.
 * @param {string} password
 */
function length(password) {
  let n = 0;
  for (const _ of password) n++;
  return n;
}

/**
 * @param {number} [min]
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function minLength(min = 12, text = `At least ${min} characters`) {
  return { id: "length", text, test: (pw) => length(pw) >= min };
}

/**
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function hasNumber(text = "A number") {
  return { id: "number", text, test: (pw) => DIGIT.test(pw) };
}

/**
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function hasSymbol(text = "A symbol") {
  return {
    id: "symbol",
    text,
    test: (pw) => SYMBOL.test(pw),
  };
}

/**
 * Reject whitespace. NIST says to allow spaces in a password; use this for a
 * secret that ends up in a header, a shell or an env file.
 *
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function noSpaces(text = "No spaces") {
  return { id: "spaces", text, test: (pw) => !WHITESPACE.test(pw) };
}

/**
 * Reject a password that contains one of the `userInputs`.
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function notContainingUserInput(
  text = "Does not contain your name or email address",
) {
  return {
    id: "user-input",
    text,
    when: (ctx) => userInputTokens(ctx.userInputs).length > 0,
    test: (pw, ctx) => {
      const lower = pw.toLowerCase();
      return !userInputTokens(ctx.userInputs).some((t) => lower.includes(t));
    },
  };
}

/**
 * Reject a password on the blocklist.
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function notCommon(text = "Not a commonly used password") {
  return {
    id: "common",
    text,
    test: (pw, ctx) => pw === "" || !isCommonPassword(pw, ctx.blocklist),
  };
}

/**
 * Require the password to equal another, for a confirm field.
 * @param {string} other
 * @param {string} [text]
 * @returns {PasswordRequirement}
 */
export function matches(other, text = "Passwords match") {
  return { id: "match", text, test: (pw) => pw !== "" && pw === other };
}

/**
 * The built-in rules, as factories.
 */
export const passwordRules = {
  minLength,
  hasNumber,
  hasSymbol,
  noSpaces,
  notContainingUserInput,
  notCommon,
  matches,
};

/**
 * NIST SP 800-63B: length and a blocklist, no composition rules.
 * @returns {PasswordRequirement[]}
 */
export function defaultRequirements() {
  return [minLength(12), notCommon(), notContainingUserInput()];
}

/**
 * Run requirements against a password.
 *
 * @param {string} password
 * @param {PasswordRequirement[]} requirements
 * @param {{ userInputs?: string[], blocklist?: import("./blocklist.js").Blocklist | Iterable<string> }} [options]
 * @returns {{ results: RequirementResult[], unmet: RequirementResult[], valid: boolean }}
 */
export function checkRequirements(password, requirements, options = {}) {
  /** @type {RuleContext} */
  const context = {
    userInputs: options.userInputs ?? [],
    blocklist: toBlocklist(options.blocklist) ?? getDefaultBlocklist(),
  };
  const results = requirements
    .filter((r) => !r.when || r.when(context))
    // Nothing typed yet: no rule is met, even "not a common password".
    .map((r) => ({
      id: r.id,
      text: r.text,
      met: password !== "" && !!r.test(password, context),
    }));
  const unmet = results.filter((r) => !r.met);
  return { results, unmet, valid: unmet.length === 0 };
}
