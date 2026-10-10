// @ts-check

/**
 * A small, dependency-free syntax highlighter for JavaScript/TypeScript,
 * Svelte/HTML, CSS, JSON, shell, and diffs. Adapted from
 * carbon-preprocess-svelte's `markdown()` highlighter.
 *
 * `tokenize` is pure and runs anywhere, so the same tokens serve two
 * renderers: `highlight` emits `<span class="tok-…">` at build time, and in
 * the browser `highlightCode` feeds the token offsets to the CSS Custom
 * Highlight API with no DOM changes. Token types are Carbon's `syntax-*`
 * token names: `tok-keyword` is colored by `--cds-syntax-keyword`.
 */

/**
 * @typedef {"angle-bracket"
 *   | "attribute-name"
 *   | "attribute-value"
 *   | "bool"
 *   | "brace"
 *   | "bracket"
 *   | "class-name"
 *   | "color"
 *   | "comment"
 *   | "control-keyword"
 *   | "definition"
 *   | "definition-keyword"
 *   | "deleted"
 *   | "function"
 *   | "inserted"
 *   | "keyword"
 *   | "meta"
 *   | "module-keyword"
 *   | "null"
 *   | "number"
 *   | "operator"
 *   | "paren"
 *   | "property-name"
 *   | "punctuation"
 *   | "regexp"
 *   | "self"
 *   | "special"
 *   | "special-string"
 *   | "string"
 *   | "tag-name"
 *   | "type-name"
 *   | "unit"
 *   | "variable-name"} TokenType
 */

/**
 * A run of source text; `type` is `null` for plain text.
 * @typedef {{ type: TokenType | null; text: string }} Token
 */

/** @typedef {(code: string, out: Token[]) => void} Lexer */

/**
 * Chooses the token type for a rule's match.
 * @template S
 * @callback Classify
 * @param {string} text
 * @param {number} at
 * @param {S} state
 * @returns {TokenType | null}
 */

/**
 * A lexer rule: a sticky pattern, the token type for its match (or a
 * function choosing one), and an optional guard on the current state.
 * @template S
 * @typedef {[
 *   pattern: RegExp,
 *   type: TokenType | null | Classify<S>,
 *   when?: (state: S) => boolean,
 * ]} Rule
 */

/** @typedef {{ code: string; out: Token[]; brackets: string[] }} ScriptState */

/**
 * `depth` counts the braces and parentheses that hold declarations. `open`
 * lists every open brace and parenthesis, with an at-rule's `{` as `at`
 * (its body holds rules). `atRule` is set while an at-rule's prelude is
 * read. `number` marks that the previous token was a number, so letters
 * right after it are its unit.
 * @typedef {{
 *   code: string;
 *   depth: number;
 *   open: string[];
 *   atRule: boolean;
 *   number: boolean;
 * }} CssState
 */

/** @type {Record<string, string>} */
const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "{": "&#123;",
  "}": "&#125;",
};
const ESCAPE_TEXT = /[&<>"{}]/g;
/**
 * Escape text for HTML and Svelte markup: HTML specials plus `{` and `}`.
 * @param {string} text
 */
function escapeText(text) {
  return text.replace(ESCAPE_TEXT, (c) => ESCAPES[c]);
}
/**
 * Index of the quote that closes the string opening at `start`, or -1.
 * @param {string} src
 * @param {number} start
 * @returns {number}
 */
function skipString(src, start) {
  const quote = src[start];
  for (let i = start + 1; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++;
    } else if (c === quote) {
      return i;
    } else if (quote === "`" && c === "$" && src[i + 1] === "{") {
      const end = skipExpression(src, i + 1);
      if (end < 0) return -1;
      i = end - 1;
    }
  }
  return -1;
}
/**
 * Index just past the `}` matching the `{` at `start`, or -1.
 * @param {string} src
 * @param {number} start
 * @returns {number}
 */
function skipExpression(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(src, i);
      if (i < 0) return -1;
    } else if (c === "/" && src[i + 1] === "/") {
      const newline = src.indexOf("\n", i);
      if (newline < 0) return -1;
      i = newline;
    } else if (c === "/" && src[i + 1] === "*") {
      const close = src.indexOf("*/", i + 2);
      if (close < 0) return -1;
      i = close + 1;
    } else if (c === "{") {
      depth++;
    } else if (c === "}" && --depth === 0) {
      return i + 1;
    }
  }
  return -1;
}
const CONTROL = new Set(
  "if else for while do switch case default break continue return throw try catch finally await yield".split(
    " ",
  ),
);
const MODULE = new Set(["import", "export", "from"]);
const DEFINITION = new Set(
  "const let var function class extends interface type enum".split(" "),
);
const KEYWORDS = new Set(
  "new typeof instanceof in of delete void async as satisfies keyof readonly declare implements public private protected static get set abstract".split(
    " ",
  ),
);
const JS_COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y;
const JS_STRING =
  /`(?:\\[\s\S]|[^`\\])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const JS_REGEXP =
  /\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuvy]*/y;
const JS_NUMBER =
  /(?:0[xob][\da-f_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:e[+-]?\d+)?)n?/iy;
const IDENTIFIER = /[A-Za-z_$][\w$]*/y;
const JS_OPERATOR =
  /=>|\+\+|--|\.\.\.|\?\?=?|\?\.|[=!]==?|[<>]{1,3}=?|&&=?|\|\|=?|\*\*=?|[-+*/%&|^~!?:=]=?/y;
const WHITESPACE = /\s+/y;
const PUNCTUATION = /[{}()[\];,.:]/y;
const UPPERCASE = /^[A-Z]/;
const TS_PRIMITIVES = new Set(
  "string number boolean any unknown never void object bigint symbol".split(
    " ",
  ),
);
const TYPE_POSITION = new Set([":", "|", "&", "<", ",", "=>"]);
const NEXT_IS_CALL = /\s*\(/y;
const NEXT_IS_COLON = /\s*:/y;
/** `key:` or `key?:`, not `::`. */
const NEXT_IS_KEY_COLON = /\s*\??:(?!:)/y;
/** Tokens a key follows inside braces: `{ a: 1, b: 2 }`, `{ a: string; b?: number }`. */
const BEFORE_KEY = new Set(["{", ",", ";"]);
const OPEN_BRACKETS = new Set(["{", "(", "["]);
/** Control keywords whose `{` opens an object, not a block: `return { a: 1 }`. */
const VALUE_KEYWORDS = new Set(["return", "throw", "yield", "await", "case"]);
const CLOSE_BRACKETS = new Set(["}", ")", "]"]);
/**
 * Last non-plain token before `end`, for context-dependent identifiers.
 * @param {Token[]} out
 * @param {number} [end]
 * @returns {Token | undefined}
 */
function lastSignificant(out, end = out.length) {
  for (let i = end - 1; i >= 0; i--) {
    if (out[i].type !== null || out[i].text.trim() !== "") return out[i];
  }
  return undefined;
}
/**
 * Whether a `/` here starts a regular expression rather than division.
 * @param {Token | undefined} previous
 */
function regexAllowed(previous) {
  if (!previous) return true;
  if (previous.type === "operator" || previous.type === "punctuation") {
    return true;
  }
  if (previous.text === "(" || previous.text === "[" || previous.text === "{") {
    return true;
  }
  return (
    previous.type === "control-keyword" ||
    previous.type === "keyword" ||
    previous.type === "module-keyword"
  );
}
/**
 * The match of sticky `pattern` at `at`, or `null`.
 * @param {RegExp} pattern
 * @param {string} code
 * @param {number} at
 */
function sticky(pattern, code, at) {
  pattern.lastIndex = at;
  const match = pattern.exec(code);
  return match ? match[0] : null;
}
/**
 * Run `rules` over `code`. The first matching rule wins; a character no rule
 * matches is plain text. `after` sees each token, to update the state.
 * @template S
 * @param {string} code
 * @param {Token[]} out
 * @param {Rule<S>[]} rules
 * @param {S} state
 * @param {(token: Token, state: S) => void} [after]
 */
function runRules(code, out, rules, state, after) {
  let pos = 0;
  while (pos < code.length) {
    /** @type {Token} */
    let token = { type: null, text: code[pos] };
    for (const [pattern, type, when] of rules) {
      if (when && !when(state)) continue;
      const text = sticky(pattern, code, pos);
      if (!text) continue;
      token = {
        type: typeof type === "function" ? type(text, pos, state) : type,
        text,
      };
      break;
    }
    out.push(token);
    after?.(token, state);
    pos += token.text.length;
  }
}
/**
 * @param {string} c
 * @returns {TokenType | null}
 */
function punctuationType(c) {
  if (c === "{" || c === "}") return "brace";
  if (c === "(" || c === ")") return "paren";
  if (c === "[" || c === "]") return "bracket";
  return ";,.:".includes(c) ? "punctuation" : null;
}
/** @type {Rule<ScriptState>[]} */
const SCRIPT_RULES = [
  [WHITESPACE, null],
  [JS_COMMENT, "comment"],
  [JS_REGEXP, "regexp", (state) => regexAllowed(lastSignificant(state.out))],
  [
    JS_STRING,
    // A module specifier: `from "pkg"`, `import "./x.css"`.
    (_text, _at, state) =>
      lastSignificant(state.out)?.type === "module-keyword"
        ? "special-string"
        : "string",
  ],
  [JS_NUMBER, "number"],
  [
    IDENTIFIER,
    (text, at, state) =>
      classifyIdentifier(
        text,
        state.code,
        at,
        state.out,
        state.brackets.at(-1) === "{",
      ),
  ],
  [JS_OPERATOR, "operator"],
  [PUNCTUATION, (text) => punctuationType(text)],
];
/** @type {Lexer} */
const lexScript = (code, out) => {
  runRules(
    code,
    out,
    SCRIPT_RULES,
    /** @type {ScriptState} */ ({ code, out, brackets: [] }),
    ({ text }, state) => {
      if (OPEN_BRACKETS.has(text)) {
        state.brackets.push(
          text === "{" &&
            opensBlock(lastSignificant(state.out, state.out.length - 1))
            ? "block"
            : text,
        );
      } else if (CLOSE_BRACKETS.has(text)) state.brackets.pop();
    },
  );
};
/**
 * Whether a `{` after `previous` opens a block: `) {`, `=> {`, `else {`.
 * @param {Token | undefined} previous
 */
function opensBlock(previous) {
  if (!previous) return false;
  if (previous.text === ")" || previous.text === "=>") return true;
  return (
    previous.type === "control-keyword" && !VALUE_KEYWORDS.has(previous.text)
  );
}
/**
 * @param {string} name
 * @param {string} code
 * @param {number} pos
 * @param {Token[]} out
 * @param {boolean} inBraces - the innermost open bracket is an object or type `{`
 * @returns {TokenType | null}
 */
function classifyIdentifier(name, code, pos, out, inBraces) {
  const previous = lastSignificant(out);
  if (previous?.text === "." || previous?.text === "?.") {
    NEXT_IS_CALL.lastIndex = pos + name.length;
    return NEXT_IS_CALL.test(code) ? "function" : "property-name";
  }
  // An object or type literal key, including keyword names (`{ default: x }`).
  if (inBraces && (!previous || BEFORE_KEY.has(previous.text))) {
    NEXT_IS_KEY_COLON.lastIndex = pos + name.length;
    if (NEXT_IS_KEY_COLON.test(code)) return "property-name";
  }
  if (CONTROL.has(name)) return "control-keyword";
  if (MODULE.has(name)) return "module-keyword";
  if (DEFINITION.has(name)) return "definition-keyword";
  if (KEYWORDS.has(name)) return "keyword";
  if (name === "true" || name === "false") return "bool";
  if (name === "null" || name === "undefined") return "null";
  if (name === "this" || name === "super") return "self";
  if (previous?.type === "definition-keyword") return "definition";
  NEXT_IS_CALL.lastIndex = pos + name.length;
  if (NEXT_IS_CALL.test(code)) return "function";
  if (UPPERCASE.test(name)) return "type-name";
  // TypeScript's built-in types, in a type position: `role: string`.
  if (TS_PRIMITIVES.has(name) && previous && TYPE_POSITION.has(previous.text)) {
    return "type-name";
  }
  return null;
}
const CSS_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y;
const CSS_STRING = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const CSS_NUMBER = /-?(?:\d+\.?\d*|\.\d+)/y;
const CSS_UNIT = /%|[a-z]+/iy;
const CSS_COLOR = /#[\da-f]{3,8}\b/iy;
const CSS_AT_RULE = /@[\w-]+/y;
const CSS_IDENT = /-?-?[A-Za-z_][\w-]*/y;
const CSS_SELECTOR_MARK = /[.#:]{1,2}-?[A-Za-z_][\w-]*/y;
/**
 * @param {string} text
 * @param {number} at
 * @param {CssState} state
 * @returns {TokenType | null}
 */
function cssIdentifier(text, at, state) {
  NEXT_IS_CALL.lastIndex = at + text.length;
  if (NEXT_IS_CALL.test(state.code)) return "function";
  if (state.depth === 0) return "tag-name";
  NEXT_IS_COLON.lastIndex = at + text.length;
  if (NEXT_IS_COLON.test(state.code)) return "property-name";
  return text.startsWith("--") ? "variable-name" : null;
}
/** @type {Rule<CssState>[]} */
const CSS_RULES = [
  [WHITESPACE, null],
  [CSS_COMMENT, "comment"],
  [CSS_STRING, "string"],
  [CSS_AT_RULE, "keyword"],
  [CSS_COLOR, "color", (state) => state.depth > 0],
  [
    CSS_SELECTOR_MARK,
    (text) => (text[0] === ":" ? "special" : "class-name"),
    (state) => state.depth === 0,
  ],
  [CSS_NUMBER, "number", (state) => state.depth > 0],
  [CSS_UNIT, "unit", (state) => state.number],
  [CSS_IDENT, cssIdentifier],
  [PUNCTUATION, (text) => punctuationType(text)],
];
/** @type {Lexer} */
const lexCss = (code, out) => {
  runRules(
    code,
    out,
    CSS_RULES,
    /** @type {CssState} */ ({
      code,
      depth: 0,
      number: false,
      open: [],
      atRule: false,
    }),
    (token, state) => {
      if (token.type === "keyword" && token.text.startsWith("@")) {
        state.atRule = true;
      } else if (token.text === "{" || token.text === "(") {
        const at = token.text === "{" && state.atRule && state.depth === 0;
        state.open.push(at ? "at" : token.text);
        if (!at) state.depth++;
        if (token.text === "{") state.atRule = false;
      } else if (token.text === "}" || token.text === ")") {
        if (state.open.pop() !== "at") {
          state.depth = Math.max(0, state.depth - 1);
        }
      } else if (token.text === ";") {
        state.atRule = false;
      }
      state.number = token.type === "number";
    },
  );
};
const MARKUP_COMMENT = /<!--[\s\S]*?(?:-->|$)/y;
const TAG_OPEN = /<\/?(?=[A-Za-z])/y;
const TAG_NAME = /[A-Za-z][\w.:-]*/y;
const ATTRIBUTE_NAME = /[^\s=/>{"']+/y;
const QUOTED = /"[^"]*"?|'[^']*'?/y;
const UNQUOTED = /[^\s>"'`=<]+/y;
const BLOCK_TAG = /[#:/@][A-Za-z]+/y;
const TEXT = /[^<{]+/y;
/**
 * `{expression}` or `{#if …}`: braces, a block keyword, and the script inside.
 * @param {string} code
 * @param {number} pos
 * @param {Token[]} out
 * @returns {number} where the expression ends
 */
function lexMustache(code, pos, out) {
  const end = skipExpression(code, pos);
  const stop = end < 0 ? code.length : end;
  out.push({ type: "brace", text: "{" });
  let inner = code.slice(pos + 1, end < 0 ? stop : stop - 1);
  const block = sticky(BLOCK_TAG, inner, 0);
  if (block) {
    out.push({ type: "control-keyword", text: block });
    inner = inner.slice(block.length);
  }
  lexScript(inner, out);
  if (end >= 0) out.push({ type: "brace", text: "}" });
  return stop;
}
/**
 * A quoted attribute value. Svelte reads `{…}` inside the quotes as an
 * expression (`on:click="{() => log("x")}"`), so those parts are script.
 * @param {string} code
 * @param {number} start
 * @param {Token[]} out
 * @returns {number} where the value ends
 */
function lexQuotedValue(code, start, out) {
  const quote = code[start];
  let text = quote;
  let pos = start + 1;
  const flushText = () => {
    if (text) out.push({ type: "attribute-value", text });
    text = "";
  };
  while (pos < code.length && code[pos] !== quote) {
    if (code[pos] === "{") {
      flushText();
      pos = lexMustache(code, pos, out);
      continue;
    }
    text += code[pos];
    pos++;
  }
  if (pos < code.length) {
    text += quote;
    pos++;
  }
  flushText();
  return pos;
}
/**
 * A tag's attributes, up to its `>` or `/>`.
 * @param {string} code
 * @param {number} start
 * @param {Token[]} out
 * @returns {number} where they end
 */
function lexAttributes(code, start, out) {
  let pos = start;
  while (
    pos < code.length &&
    code[pos] !== ">" &&
    !code.startsWith("/>", pos)
  ) {
    if (code[pos] === "{") {
      pos = lexMustache(code, pos, out);
      continue;
    }
    if ((code[pos] === '"' || code[pos] === "'") && out.at(-1)?.text === "=") {
      pos = lexQuotedValue(code, pos, out);
      continue;
    }
    const afterEquals = out.at(-1)?.text === "=";
    const whitespace = sticky(WHITESPACE, code, pos);
    const quoted = whitespace ? null : sticky(QUOTED, code, pos);
    const unquoted =
      whitespace || quoted || !afterEquals ? null : sticky(UNQUOTED, code, pos);
    const name =
      whitespace || quoted || unquoted
        ? null
        : sticky(ATTRIBUTE_NAME, code, pos);
    /** @type {Token} */
    const token = whitespace
      ? { type: null, text: whitespace }
      : code[pos] === "="
        ? { type: "operator", text: "=" }
        : quoted || unquoted
          ? {
              type: "attribute-value",
              text: /** @type {string} */ (quoted ?? unquoted),
            }
          : name
            ? { type: "attribute-name", text: name }
            : { type: null, text: code[pos] };
    out.push(token);
    pos += token.text.length;
  }
  return pos;
}
/** @type {Lexer} */
const lexMarkup = (code, out) => {
  let pos = 0;
  while (pos < code.length) {
    const comment = sticky(MARKUP_COMMENT, code, pos);
    if (comment) {
      out.push({ type: "comment", text: comment });
      pos += comment.length;
      continue;
    }
    if (code[pos] === "{") {
      pos = lexMustache(code, pos, out);
      continue;
    }
    const open = sticky(TAG_OPEN, code, pos);
    if (!open) {
      const text = sticky(TEXT, code, pos) ?? code[pos];
      out.push({ type: null, text });
      pos += text.length;
      continue;
    }
    out.push({ type: "angle-bracket", text: open });
    pos += open.length;
    const name = sticky(TAG_NAME, code, pos) ?? "";
    out.push({ type: "tag-name", text: name });
    pos = lexAttributes(code, pos + name.length, out);
    const close = code.startsWith("/>", pos)
      ? "/>"
      : code[pos] === ">"
        ? ">"
        : "";
    if (close) out.push({ type: "angle-bracket", text: close });
    pos += close.length;
    // The insides of `<script>` and `<style>` are another language.
    const lower = name.toLowerCase();
    if (
      open === "<" &&
      close === ">" &&
      (lower === "script" || lower === "style")
    ) {
      const end = code.indexOf(`</${lower}`, pos);
      const stop = end < 0 ? code.length : end;
      (lower === "script" ? lexScript : lexCss)(code.slice(pos, stop), out);
      pos = stop;
    }
  }
};
const JSON_STRING = /"(?:\\.|[^"\\\n])*"?/y;
/** @type {Rule<{ code: string }>[]} */
const JSON_RULES = [
  [WHITESPACE, null],
  [
    JSON_STRING,
    (text, at, state) => {
      NEXT_IS_COLON.lastIndex = at + text.length;
      return NEXT_IS_COLON.test(state.code) ? "property-name" : "string";
    },
  ],
  [CSS_NUMBER, "number"],
  [
    IDENTIFIER,
    (text) =>
      text === "null"
        ? "null"
        : text === "true" || text === "false"
          ? "bool"
          : null,
  ],
  [PUNCTUATION, (text) => punctuationType(text)],
];
/** @type {Lexer} */
const lexJson = (code, out) => {
  runRules(code, out, JSON_RULES, { code });
};
const SHELL_LINE = /[^\n]*\n?/g;
const SHELL_TOKEN =
  /(#.*)|("(?:\\.|[^"\\])*"?|'[^']*'?)|(\$\{[^}]*\}?|\$[\w@*#?$!-]+)|(\s--?[\w-]+(?:=\S*)?)|(\|\|?|&&|;|>>?|<|&)|([^\s"'$|&;<>#]+)|(\s+)/g;
const SPACE_BEFORE = /\s/;
/** @type {Lexer} */
const lexShell = (code, out) => {
  for (const line of code.match(SHELL_LINE) ?? []) {
    let command = true;
    for (const m of line.matchAll(SHELL_TOKEN)) {
      const [text, comment, string, variable, flag, operator, word] = m;
      const at = m.index ?? 0;
      if (
        comment !== undefined &&
        (at === 0 || SPACE_BEFORE.test(line[at - 1]))
      ) {
        out.push({ type: "comment", text });
      } else if (string !== undefined) {
        out.push({ type: "string", text });
      } else if (variable !== undefined) {
        out.push({ type: "variable-name", text });
      } else if (flag !== undefined) {
        const space = flag.length - flag.trimStart().length;
        out.push({ type: null, text: flag.slice(0, space) });
        out.push({ type: "attribute-name", text: flag.slice(space) });
      } else if (operator !== undefined) {
        out.push({ type: "operator", text });
        command = true;
      } else if (word === undefined) {
        out.push({ type: null, text });
      } else {
        out.push({ type: command ? "function" : null, text });
        command = false;
      }
    }
  }
};
/** @type {Lexer} */
const lexDiff = (code, out) => {
  for (const line of code.match(SHELL_LINE) ?? []) {
    const type = line.startsWith("+")
      ? "inserted"
      : line.startsWith("-")
        ? "deleted"
        : line.startsWith("@@")
          ? "meta"
          : null;
    out.push({ type, text: line });
  }
};
/** @type {Record<string, Lexer>} */
const LEXERS = {
  js: lexScript,
  javascript: lexScript,
  mjs: lexScript,
  cjs: lexScript,
  jsx: lexScript,
  ts: lexScript,
  typescript: lexScript,
  tsx: lexScript,
  svelte: lexMarkup,
  html: lexMarkup,
  xml: lexMarkup,
  svg: lexMarkup,
  css: lexCss,
  scss: lexCss,
  json: lexJson,
  jsonc: lexScript,
  sh: lexShell,
  bash: lexShell,
  shell: lexShell,
  zsh: lexShell,
  diff: lexDiff,
};
/**
 * Tokens for `code` in `lang`, or `undefined` for a language it doesn't know.
 * The tokens' text joins back to `code` exactly.
 * @param {string} code
 * @param {string} lang - `js`, `ts`, `svelte`, `html`, `css`, `json`, `bash`, `diff`, and aliases
 * @returns {Token[] | undefined}
 */
export function tokenize(code, lang) {
  const lexer = LEXERS[lang.toLowerCase()];
  if (!lexer) return undefined;
  /** @type {Token[]} */
  const out = [];
  lexer(code, out);
  return out;
}
/**
 * Highlight `code` as HTML spans (`<span class="tok-keyword">`), escaped for
 * `{@html}` and Svelte markup. Returns `undefined` for languages it doesn't
 * know, which leaves the block plain.
 * @param {string} code
 * @param {string} lang
 * @returns {string | undefined}
 */
export function highlight(code, lang) {
  const tokens = tokenize(code, lang);
  if (!tokens) return undefined;
  let html = "";
  for (const { type, text } of tokens) {
    const escaped = escapeText(text);
    html += type ? `<span class="tok-${type}">${escaped}</span>` : escaped;
  }
  return html;
}
