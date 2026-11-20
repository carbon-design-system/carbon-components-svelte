// @ts-check

/**
 * @typedef {import("./formula-lang.js").FormulaToken} FormulaToken
 * @typedef {import("./formula-lang.js").FormulaDiagnostic} FormulaDiagnostic
 */

/**
 * @typedef {"function" | "field" | "string" | "number" | "operator" | "punctuation" | "name" | "constant" | "none"} HighlightKind
 */

/**
 * @typedef {object} HighlightRun
 * @property {string} text
 * @property {number} start
 * @property {number} end
 * @property {HighlightKind} kind
 * @property {boolean} error - Part of a diagnostic's range.
 */

const OPERAND_END = new Set(["number", "string", "field", "name", "rparen"]);

/**
 * Cut the source into runs for the layer behind the text. Joined, the runs
 * are the source. A run has one kind and one error flag, so each becomes one
 * element; neighbours that agree are merged.
 * @param {string} source
 * @param {FormulaToken[]} tokens
 * @param {FormulaDiagnostic[]} diagnostics - In source order.
 * @param {{ isField?: (name: string) => boolean }} [options] - Marks a bare name that is a field.
 * @returns {HighlightRun[]}
 */
export function highlightRuns(source, tokens, diagnostics, options = {}) {
  /** @type {HighlightKind[]} */
  const kinds = [];
  /** @type {FormulaToken | null} */
  let previous = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    /** @type {HighlightKind} */
    let kind = "none";
    switch (token.type) {
      case "number":
        kind = "number";
        break;
      case "string":
        kind = "string";
        break;
      case "field":
        kind = "field";
        break;
      case "operator":
        kind = "operator";
        break;
      case "lparen":
      case "rparen":
      case "comma":
        kind = "punctuation";
        break;
      case "name": {
        let next = i + 1;
        while (tokens[next]?.type === "space") next++;
        const word = source.slice(token.start, token.end);
        const lower = word.toLowerCase();
        const isCall = tokens[next]?.type === "lparen";
        if (isCall) kind = "function";
        else if (lower === "true" || lower === "false") kind = "constant";
        else if (
          lower === "not" ||
          ((lower === "and" || lower === "or") &&
            previous &&
            OPERAND_END.has(previous.type))
        ) {
          kind = "operator";
        } else kind = options.isField?.(word) ? "field" : "name";
        break;
      }
      default:
        break;
    }
    kinds.push(kind);
    if (token.type !== "space") previous = token;
  }

  // Cut points: every token edge, and every diagnostic edge inside the text.
  const cuts = new Set();
  for (const token of tokens) {
    cuts.add(token.start);
    cuts.add(token.end);
  }
  for (const d of diagnostics) {
    if (d.end > d.start) {
      cuts.add(Math.min(d.start, source.length));
      cuts.add(Math.min(d.end, source.length));
    }
  }
  const points = [...cuts].sort((a, b) => a - b);

  /** @type {HighlightRun[]} */
  const runs = [];
  let t = 0;
  let d = 0;
  let errorEnd = -1;

  for (let p = 0; p < points.length - 1; p++) {
    const start = points[p];
    const end = points[p + 1];
    while (t < tokens.length && tokens[t].end <= start) t++;
    while (d < diagnostics.length && diagnostics[d].start <= start) {
      if (diagnostics[d].end > diagnostics[d].start) {
        errorEnd = Math.max(errorEnd, diagnostics[d].end);
      }
      d++;
    }
    const kind = t < tokens.length ? kinds[t] : "none";
    const error = start < errorEnd;
    const last = runs[runs.length - 1];
    if (last && last.kind === kind && last.error === error && kind === "none") {
      last.end = end;
      last.text = source.slice(last.start, end);
    } else {
      runs.push({ text: source.slice(start, end), start, end, kind, error });
    }
  }

  return runs;
}
