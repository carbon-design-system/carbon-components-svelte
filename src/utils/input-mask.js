// @ts-check

/**
 * Pure engine behind the `mask` action: no DOM, no `window`. Safe to run on
 * the server, so a consumer can format an initial value before it renders.
 *
 * A mask is a pattern of slots and literals. The model is the slots only:
 * `raw` is the characters that fill them, and the displayed text is built
 * from `raw` by putting the pattern's literals between them. The caret is a
 * count of slot characters (a "logical" position), not a text index, so it
 * survives every literal the engine adds or removes.
 *
 * Slots: `9` digit, `A` letter (upper-cased), `a` letter (lower-cased),
 * `*` letter or digit, `X` letter or digit (upper-cased). `\` makes the next
 * character a literal. Anything else is a literal.
 *
 * @typedef {string | ((raw: string) => string)} MaskPattern
 * @typedef {{ pattern: MaskPattern, eager?: boolean }} MaskOptions
 * @typedef {{ value: string, rawValue: string, complete: boolean, pattern: string }} MaskResult
 * @typedef {{ value: string, start: number, end: number }} MaskState
 * @typedef {{ type: "insert", text: string } | { type: "delete", direction: "backward" | "forward", unit: "char" | "word" | "line" }} MaskChange
 * @typedef {MaskResult & { caret: number, changed: boolean }} MaskEditResult
 */

const SLOT_KINDS = "9AaX*";
const DIGIT = /^\p{Nd}$/u;
const LETTER = /^\p{L}$/u;

/**
 * Digits typed in any script (Arabic-Indic, fullwidth from a Japanese IME)
 * count as the ASCII digit of the same value. Decimal digits sit in runs of
 * ten, so the value is the distance from the start of the run.
 * @param {string} char
 * @returns {string | null}
 */
function asciiDigit(char) {
  if (char >= "0" && char <= "9") return char;
  if (!DIGIT.test(char)) return null;
  const code = /** @type {number} */ (char.codePointAt(0));
  let distance = 0;
  while (distance < 50 && DIGIT.test(String.fromCodePoint(code - distance - 1)))
    distance++;
  return String(distance % 10);
}

/** `ß` upper-cases to two characters; keep it as typed. @param {string} c */
const upper = (c) => {
  const u = c.toUpperCase();
  return u.length === c.length ? u : c;
};

/**
 * The character a slot stores for `char`, or `null` if the slot refuses it.
 * @param {string} kind
 * @param {string} char
 * @returns {string | null}
 */
function accept(kind, char) {
  if (kind === "9") return asciiDigit(char);
  const isLetter = LETTER.test(char);
  if (kind === "A") return isLetter ? upper(char) : null;
  if (kind === "a") return isLetter ? char.toLowerCase() : null;
  const digit = isLetter ? null : asciiDigit(char);
  if (!isLetter && digit === null) return null;
  const value = digit ?? char;
  return kind === "X" ? upper(value) : value;
}

/**
 * @typedef {{ kinds: string[], runs: string[] }} Compiled
 *   `runs[k]` is the literal text before slot `k`; `runs[kinds.length]` is
 *   the text after the last slot.
 */

/** @type {Map<string, Compiled>} */
const compiled = new Map();

/**
 * @param {string} pattern
 * @returns {Compiled}
 */
function compile(pattern) {
  const hit = compiled.get(pattern);
  if (hit) return hit;
  /** @type {string[]} */
  const kinds = [];
  const runs = [""];
  const chars = Array.from(pattern);
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === "\\" && i + 1 < chars.length) {
      runs[runs.length - 1] += chars[++i];
    } else if (SLOT_KINDS.includes(char)) {
      kinds.push(char);
      runs.push("");
    } else {
      runs[runs.length - 1] += char;
    }
  }
  if (compiled.size >= 64) compiled.clear();
  const result = { kinds, runs };
  compiled.set(pattern, result);
  return result;
}

/**
 * @param {MaskOptions} spec
 * @param {string} raw
 * @returns {Compiled & { source: string }}
 */
function resolve(spec, raw) {
  const source =
    typeof spec.pattern === "function"
      ? String(spec.pattern(raw) ?? "")
      : String(spec.pattern ?? "");
  return { ...compile(source), source };
}

/**
 * Fills slots one character at a time. The pattern is resolved again for
 * every character, so a pattern function can switch on a prefix.
 * @param {MaskOptions} spec
 */
function createFiller(spec) {
  let raw = "";
  // How much of the literal run before the next slot a typed literal used.
  let used = 0;
  return {
    get raw() {
      return raw;
    },
    /**
     * @param {string} char one code point
     * @param {boolean} literals let a typed literal that the pattern has next
     *   stand for it (typing `-` where the mask has `-`)
     * @returns {boolean} true if the character went into a slot
     */
    push(char, literals) {
      const { kinds, runs } = resolve(spec, raw);
      const index = raw.length;
      if (index >= kinds.length) return false;
      if (literals) {
        const at = runs[index].indexOf(char, used);
        if (at !== -1) {
          used = at + char.length;
          return false;
        }
      }
      const stored = accept(kinds[index], char);
      if (stored === null) return false;
      raw += stored;
      used = 0;
      return true;
    },
  };
}

/**
 * The raw characters that survive a pattern change: each is offered to the
 * slot it now lands in. Settles in a few rounds.
 * @param {MaskOptions} spec
 * @param {string} raw
 */
function canon(spec, raw) {
  let current = raw;
  for (let round = 0; round < 4; round++) {
    const filler = createFiller(spec);
    for (const char of current) filler.push(char, false);
    if (filler.raw === current) return current;
    current = filler.raw;
  }
  return current;
}

/**
 * @param {MaskOptions} spec
 * @param {string} raw canonical
 */
function render(spec, raw) {
  const { kinds, runs, source } = resolve(spec, raw);
  const chars = Array.from(raw);
  /** @type {number[]} */
  const starts = [];
  let value = "";
  for (let k = 0; k < chars.length; k++) {
    value += runs[k];
    starts.push(value.length);
    value += chars[k];
  }
  if (spec.eager && chars.length > 0) value += runs[chars.length];
  return {
    value,
    starts,
    chars,
    complete: kinds.length > 0 && chars.length === kinds.length,
    pattern: source,
    eager: !!spec.eager,
  };
}

/**
 * Turn any text (typed, pasted, set by code, a field edited by the browser)
 * into raw characters. `sources[i]` is where raw character `i` came from.
 * @param {MaskOptions} spec
 * @param {string} text
 */
function conform(spec, text) {
  const filler = createFiller(spec);
  /** @type {number[]} */
  const sources = [];
  let index = 0;
  for (const char of text.normalize("NFC")) {
    if (filler.push(char, true)) sources.push(index);
    index += char.length;
  }
  return { raw: canon(spec, filler.raw), sources };
}

/**
 * @param {MaskOptions} spec
 * @param {string} text
 * @returns {MaskResult}
 */
function format(spec, text) {
  const { raw } = conform(spec, text);
  const out = render(spec, raw);
  return {
    value: out.value,
    rawValue: raw,
    complete: out.complete,
    pattern: out.pattern,
  };
}

/** @param {MaskPattern | MaskOptions} options @returns {MaskOptions} */
function toSpec(options) {
  return typeof options === "string" || typeof options === "function"
    ? { pattern: options }
    : options;
}

/**
 * Where a logical caret sits in the text.
 * @param {ReturnType<typeof render>} out
 * @param {number} count slot characters before the caret
 * @param {"after" | "before" | number} affinity `"after"`: right after the
 *   slot character before the caret. `"before"`: right before the one after
 *   it, past any literals between. A number keeps that many literal
 *   characters after the slot character, as far as they exist.
 */
function caretIndex(out, count, affinity) {
  const after =
    count === 0 ? 0 : out.starts[count - 1] + out.chars[count - 1].length;
  const before =
    count < out.starts.length ? out.starts[count] : out.value.length;
  // An eager mask has already written the literals that follow the last
  // character, so the caret belongs after them.
  if (affinity === "after") {
    return out.eager && count === out.chars.length ? out.value.length : after;
  }
  if (affinity === "before") return before;
  return Math.min(after + affinity, before);
}

/** How many literal groups to walk for a word-wise delete. @param {Compiled} p @param {number} at */
function groupStart(p, at) {
  let g = at - 1;
  while (g > 0 && p.runs[g] === "") g--;
  return Math.max(g, 0);
}

/** @param {Compiled} p @param {number} at @param {number} length */
function groupEnd(p, at, length) {
  let g = at + 1;
  while (g < length && p.runs[g] === "") g++;
  return Math.min(g, length);
}

/**
 * Apply one edit as the browser would, then re-mask. Returns the new text
 * and where the caret goes. An edit that would push an earlier character out
 * of the pattern (typing into a full field, or deleting in front of letters
 * that cannot move into a digit slot) is refused: `changed` is false.
 * @param {MaskPattern | MaskOptions} options
 * @param {MaskState} state
 * @param {MaskChange} change
 * @returns {MaskEditResult}
 */
export function applyMaskEdit(options, state, change) {
  const spec = toSpec(options);
  const { raw, sources } = conform(spec, state.value);
  const current = render(spec, raw);
  const rawChars = current.chars;

  const before = (/** @type {number} */ at) =>
    sources.filter((s) => s < at).length;
  const startCount = before(state.start);
  const endCount = before(state.end);
  const lastEnd =
    startCount > 0
      ? sources[startCount - 1] + rawChars[startCount - 1].length
      : 0;
  const offset = Math.max(state.start - lastEnd, 0);
  const collapsed = state.start === state.end;

  /** @type {MaskEditResult} */
  const refused = {
    ...format(spec, state.value),
    value: state.value,
    caret: state.start,
    changed: false,
  };

  let from = startCount;
  let to = endCount;
  let insert = "";
  /** @type {"after" | "before" | number} */
  let affinity = "after";

  if (change.type === "insert") {
    insert = change.text.normalize("NFC");
  } else {
    affinity = change.direction === "backward" ? "before" : offset;
    if (collapsed) {
      const p = resolve(spec, raw);
      const length = rawChars.length;
      if (change.direction === "backward") {
        from =
          change.unit === "char"
            ? startCount - 1
            : change.unit === "line"
              ? 0
              : groupStart(p, startCount);
        to = startCount;
      } else {
        from = startCount;
        to =
          change.unit === "char"
            ? startCount + 1
            : change.unit === "line"
              ? length
              : groupEnd(p, startCount, length);
      }
      from = Math.max(from, 0);
      to = Math.min(to, length);
    }
    if (from >= to) return refused;
  }

  const head = rawChars.slice(0, from);
  const tail = rawChars.slice(to);

  /**
   * @param {string} text
   * @returns {{ raw: string, accepted: number, ends: number[], intact: boolean }}
   */
  const attempt = (text) => {
    const filler = createFiller(spec);
    for (const char of head) filler.push(char, false);
    /** @type {number[]} */
    const ends = [0];
    let index = 0;
    for (const char of text) {
      index += char.length;
      if (filler.push(char, true)) ends.push(index);
    }
    const accepted = ends.length - 1;
    let kept = 0;
    for (const char of tail) if (filler.push(char, false)) kept++;
    return {
      raw: filler.raw,
      accepted,
      ends,
      intact: kept === tail.length,
    };
  };

  let result = attempt(insert);
  if (change.type === "insert") {
    // Take as much of the text as fits without pushing earlier characters out.
    for (let m = result.accepted; !result.intact && m >= 0; m--) {
      result = attempt(insert.slice(0, result.ends[m]));
    }
    if (result.accepted === 0 && insert !== "") return refused;
  }
  if (!result.intact) return refused;

  const insertedCount = change.type === "insert" ? result.accepted : 0;
  const nextRaw = canon(spec, result.raw);
  const out = render(spec, nextRaw);
  const count = Math.min(from + insertedCount, out.chars.length);
  const caret = caretIndex(out, count, affinity);
  return {
    value: out.value,
    rawValue: nextRaw,
    complete: out.complete,
    pattern: out.pattern,
    caret,
    changed: out.value !== state.value || caret !== state.start,
  };
}

/**
 * Re-mask text a browser edited on its own (a composition that ended, a
 * drop, a spell-check replacement, a keyboard whose `beforeinput` cannot be
 * canceled). The caret keeps its place among the slot characters.
 * @param {MaskPattern | MaskOptions} options
 * @param {string} text
 * @param {number} caret index in `text`
 * @returns {MaskResult & { caret: number }}
 */
export function conformMaskText(options, text, caret) {
  const spec = toSpec(options);
  const { raw, sources } = conform(spec, text);
  const out = render(spec, raw);
  const count = Math.min(
    sources.filter((s) => s < caret).length,
    out.chars.length,
  );
  return {
    value: out.value,
    rawValue: raw,
    complete: out.complete,
    pattern: out.pattern,
    caret: caretIndex(out, count, "after"),
  };
}

/**
 * Build a mask from a pattern or options. Pure and SSR-safe.
 * @param {MaskPattern | MaskOptions} options
 */
export function createMask(options) {
  const spec = toSpec(options);
  return {
    options: spec,
    /**
     * Format any text, such as an initial value, as the mask would show it.
     * @param {string} text
     * @returns {MaskResult}
     */
    format: (text) => format(spec, String(text ?? "")),
    /**
     * The characters that fill the slots, without the literals.
     * @param {string} text
     */
    unmask: (text) => conform(spec, String(text ?? "")).raw,
    /**
     * The empty pattern with `char` in every slot, for the `placeholder`
     * attribute. Screen readers read a placeholder out, so keep `helperText`
     * for the format as well.
     * @param {string} [char]
     */
    placeholder(char = "_") {
      const p = resolve(spec, "");
      return p.runs.reduce(
        (text, run, k) => text + run + (k < p.kinds.length ? char : ""),
        "",
      );
    },
    /**
     * True when every slot of the pattern for `text` is filled.
     * @param {string} text
     */
    isComplete: (text) => format(spec, String(text ?? "")).complete,
    /** True when every slot of the empty pattern takes a digit. */
    isNumeric() {
      const { kinds } = resolve(spec, "");
      return kinds.length > 0 && kinds.every((kind) => kind === "9");
    },
  };
}
