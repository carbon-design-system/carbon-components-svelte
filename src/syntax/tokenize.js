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
 *   | "annotation"
 *   | "attribute-name"
 *   | "attribute-value"
 *   | "bool"
 *   | "brace"
 *   | "bracket"
 *   | "character"
 *   | "class-name"
 *   | "color"
 *   | "comment"
 *   | "control-keyword"
 *   | "definition"
 *   | "definition-keyword"
 *   | "deleted"
 *   | "escape"
 *   | "function"
 *   | "inserted"
 *   | "keyword"
 *   | "meta"
 *   | "modifier"
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
 *   when?: (state: S, at: number) => boolean,
 * ]} Rule
 */

/**
 * `svelte` enables Svelte's script syntax: `$:` statements, runes, and
 * `$store` references.
 * @typedef {{ code: string; out: Token[]; brackets: string[]; svelte: boolean }} ScriptState
 */

/**
 * `selector` is set while the current statement (up to its `{`, `;`, or
 * `}`) is a selector rather than a declaration or an at-rule prelude.
 * `number` marks that the previous token was a number, so letters right
 * after it are its unit. `attribute` tracks an attribute selector:
 * `name` inside `[` until its operator, then `value` until `]`. `scss`
 * enables `//` comments, `$variables`, and `#{}` interpolation.
 * @typedef {{
 *   code: string;
 *   selector: boolean;
 *   number: boolean;
 *   attribute: "" | "name" | "value";
 *   scss: boolean;
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
  "if else for while do switch case default break continue return throw try catch finally await yield debugger".split(
    " ",
  ),
);
const MODULE = new Set(["import", "export", "from"]);
const DEFINITION = new Set(
  "const let var function class interface type enum".split(" "),
);
const KEYWORDS = new Set(
  "new typeof instanceof in of delete void async as satisfies keyof readonly declare implements public private protected static get set abstract extends infer is asserts override accessor namespace unique".split(
    " ",
  ),
);
const JS_COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y;
const JS_STRING = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const STRING_ESCAPE =
  /\\(?:u\{[\da-fA-F]+\}|u[\da-fA-F]{4}|x[\da-fA-F]{2}|[\s\S])/g;
const DECORATOR = /@[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/y;
const PRIVATE_NAME = /#[A-Za-z_$][\w$]*/y;
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
const TYPE_POSITION = new Set([
  ":",
  "|",
  "&",
  "<",
  ",",
  "=>",
  "is",
  "extends",
  "as",
  "satisfies",
]);
const NEXT_IS_CALL = /\s*\(/y;
const NEXT_IS_TEMPLATE = /`/y;
const NEXT_IS_ARROW = /\s*=>/y;
const AFTER_PARAMS = /\s*(=>|\{|:)/y;
/**
 * Tokens a parameter name follows: `(a`, `, b`, `...rest`, and TypeScript
 * parameter properties (`constructor(readonly config: Config)`).
 */
const BEFORE_PARAM = new Set([
  "(",
  ",",
  "...",
  "readonly",
  "public",
  "private",
  "protected",
  "override",
]);
/**
 * Tokens a class or object member's name follows, so `name(…): Type {` is a
 * method, not a call in a ternary (`a ? f(x) : y`).
 */
const BEFORE_MEMBER = new Set([
  "{",
  ";",
  "}",
  ",",
  "async",
  "static",
  "get",
  "set",
  "public",
  "private",
  "protected",
  "override",
  "abstract",
  "readonly",
]);

const NEXT_IS_COLON = /\s*:/y;
/** `key:` or `key?:`, not `::`. */
const NEXT_IS_KEY_COLON = /\s*\??:(?!:)/y;
/** Tokens a key follows inside braces: `{ a: 1, b: 2 }`, `{ a: string; b?: number }`. */
const BEFORE_KEY = new Set(["{", ",", ";"]);
const OPEN_BRACKETS = new Set(["{", "(", "["]);
/** Control keywords whose `{` opens an object, not a block: `return { a: 1 }`. */
const VALUE_KEYWORDS = new Set(["return", "throw", "yield", "await", "case"]);
const CLOSE_BRACKETS = new Set(["}", ")", "]"]);
/** Svelte 5 runes; `$state.raw` and the like are a rune and a property. */
const RUNES = new Set(
  "$state $derived $effect $props $bindable $inspect $host".split(" "),
);
const REACTIVE_LABEL = /\$:(?!:)/y;
const NEXT_IS_ASSIGN = /\s*=(?![=>])/y;
const NEXT_IS_MEMBER = /^\s*[.(]/;
const LINE_INDENT = /[ \t]/;
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
 * @param {(token: Token, state: S, at: number) => void} [after]
 * @param {(at: number) => number} [lexAt] - lexes a construct at `at`
 *   itself (a template literal), returning where it ends, or -1
 */
function runRules(code, out, rules, state, after, lexAt) {
  const table = dispatchTable(rules);
  let pos = 0;
  while (pos < code.length) {
    if (lexAt) {
      const end = lexAt(pos);
      if (end >= 0) {
        pos = end;
        continue;
      }
    }
    /** @type {Token} */
    let token = { type: null, text: code[pos] };
    const c = code.charCodeAt(pos);
    for (const [pattern, type, when] of c < 128 ? table[c] : rules) {
      pattern.lastIndex = pos;
      const text = pattern.exec(code)?.[0];
      if (!text || (when && !when(state, pos))) continue;
      token = {
        type: typeof type === "function" ? type(text, pos, state) : type,
        text,
      };
      break;
    }
    out.push(token);
    after?.(token, state, pos);
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
  [JS_NUMBER, "number"],
  [PRIVATE_NAME, "property-name"],
  [DECORATOR, "annotation"],
  // A Svelte 4 reactive statement, `$: doubled = count * 2`.
  [
    REACTIVE_LABEL,
    "keyword",
    (state, at) => state.svelte && startsLine(state.code, at),
  ],
  [
    IDENTIFIER,
    (text, at, state) =>
      classifyIdentifier(
        text,
        state.code,
        at,
        state.out,
        state.brackets.at(-1),
        state.svelte,
      ),
  ],
  [JS_OPERATOR, "operator"],
  [PUNCTUATION, (text) => punctuationType(text)],
];
/**
 * Whether only spaces and tabs come before `at` on its line.
 * @param {string} code
 * @param {number} at
 */
function startsLine(code, at) {
  let i = at - 1;
  while (i >= 0 && LINE_INDENT.test(code[i])) i--;
  return i < 0 || code[i] === "\n";
}
/**
 * @param {string} code
 * @param {Token[]} out
 * @param {boolean} [svelte] - read Svelte's script syntax too
 */
function lexScript(code, out, svelte = false) {
  runRules(
    code,
    out,
    SCRIPT_RULES,
    /** @type {ScriptState} */ ({ code, out, brackets: [], svelte }),
    ({ text }, state, at) => {
      if (OPEN_BRACKETS.has(text)) {
        const previous = lastSignificant(state.out, state.out.length - 1);
        const enclosing = state.brackets.at(-1);
        state.brackets.push(
          text === "("
            ? opensParams(code, at + 1, previous, state.out)
              ? "(pattern"
              : "("
            : startsPattern(previous, enclosing)
              ? `${text}pattern`
              : text === "{" && opensBlock(previous)
                ? "block"
                : text,
        );
      } else if (CLOSE_BRACKETS.has(text)) state.brackets.pop();
    },
    (at) => {
      const c = code[at];
      if (c === "`") return lexTemplate(code, at, out, svelte);
      if (c !== '"' && c !== "'") return -1;
      const text = /** @type {string} */ (sticky(JS_STRING, code, at));
      // A module specifier: `from "pkg"`, `import "./x.css"`.
      const type =
        lastSignificant(out)?.type === "module-keyword"
          ? "special-string"
          : "string";
      pushString(text, type, out);
      return at + text.length;
    },
  );
}
/**
 * A string's text as `type` runs with its escape sequences (`\\n`,
 * `\\u00e9`) split out as `escape`.
 * @param {string} text
 * @param {TokenType} type
 * @param {Token[]} out
 */
function pushString(text, type, out) {
  if (!text.includes("\\")) {
    out.push({ type, text });
    return;
  }
  let last = 0;
  for (const match of text.matchAll(STRING_ESCAPE)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ type, text: text.slice(last, at) });
    out.push({ type: "escape", text: match[0] });
    last = at + match[0].length;
  }
  if (last < text.length) out.push({ type, text: text.slice(last) });
}
/**
 * A template literal at `at`: its text as strings, each `\${…}` as
 * `special` delimiters around the script inside (nested templates
 * included). Returns where it ends.
 * @param {string} code
 * @param {number} at
 * @param {Token[]} out
 * @param {boolean} svelte
 */
function lexTemplate(code, at, out, svelte) {
  let start = at;
  let pos = at + 1;
  while (pos < code.length) {
    const c = code[pos];
    if (c === "\\") {
      pos += 2;
    } else if (c === "`") {
      pos++;
      break;
    } else if (c === "$" && code[pos + 1] === "{") {
      if (pos > start) pushString(code.slice(start, pos), "string", out);
      const end = skipExpression(code, pos + 1);
      const stop = end < 0 ? code.length : end - 1;
      out.push({ type: "special", text: "${" });
      lexScript(code.slice(pos + 2, stop), out, svelte);
      if (end < 0) return code.length;
      out.push({ type: "special", text: "}" });
      pos = end;
      start = pos;
    } else {
      pos++;
    }
  }
  pos = Math.min(pos, code.length);
  if (pos > start) pushString(code.slice(start, pos), "string", out);
  return pos;
}
/**
 * Index of the `)` that closes the `(` before `at`, skipping strings,
 * templates, and comments, or -1.
 * @param {string} code
 * @param {number} at
 */
function closingParen(code, at) {
  let depth = 1;
  for (let i = at; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipString(code, i);
      if (i < 0) return -1;
    } else if (c === "/" && code[i + 1] === "/") {
      i = code.indexOf("\n", i);
      if (i < 0) return -1;
    } else if (c === "/" && code[i + 1] === "*") {
      i = code.indexOf("*/", i + 2);
      if (i < 0) return -1;
      i++;
    } else if (c === "(") {
      depth++;
    } else if (c === ")" && --depth === 0) {
      return i;
    }
  }
  return -1;
}
/**
 * Whether the `(` before `at` opens parameters: after `function` or a
 * function declaration's name, after `catch`, or followed (past its `)`)
 * by `=>`, or by `{` after a name (a method).
 * @param {string} code
 * @param {number} at
 * @param {Token | undefined} previous
 * @param {Token[]} out
 */
function opensParams(code, at, previous, out) {
  if (!previous) return false;
  if (previous.text === "function" || previous.text === "catch") return true;
  // `if (`, `for (`, `while (`, `switch (`: a condition, not parameters.
  if (previous.type === "control-keyword") return false;
  if (
    previous.type === "definition" &&
    lastSignificant(out, out.lastIndexOf(previous))?.text === "function"
  ) {
    return true;
  }
  const close = closingParen(code, at);
  if (close < 0) return false;
  AFTER_PARAMS.lastIndex = close + 1;
  const after = AFTER_PARAMS.exec(code)?.[1];
  if (after === "=>") return true;
  if (
    previous.type !== "function" &&
    previous.type !== "definition" &&
    previous.type !== "property-name"
  ) {
    return false;
  }
  if (after === "{") return true;
  // A method with a return type: `async resolve(id: string): Promise<T> {`.
  return (
    after === ":" &&
    BEFORE_MEMBER.has(
      lastSignificant(out, out.lastIndexOf(previous))?.text ?? "",
    )
  );
}
/**
 * Whether a `{` or `[` after `previous` opens a destructuring pattern:
 * `let { a, b = 1 } = …`, `const [x, y] = …`, or one nested in another
 * (`{ a: { b } }`, `[{ c }]`).
 * @param {Token | undefined} previous
 * @param {string | undefined} enclosing - the innermost open bracket
 */
function startsPattern(previous, enclosing) {
  if (previous?.type === "definition-keyword") return true;
  return (
    enclosing?.endsWith("pattern") === true &&
    (previous?.text === ":" ||
      previous?.text === "," ||
      previous?.text === "[" ||
      previous?.text === "{" ||
      previous?.text === "(")
  );
}
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
 * @param {string | undefined} bracket - the innermost open bracket: `{`,
 *   `block`, `{pattern`, `[pattern`, …
 * @param {boolean} svelte - Svelte's runes and `$store` references
 * @returns {TokenType | null}
 */
function classifyIdentifier(name, code, pos, out, bracket, svelte) {
  const previous = lastSignificant(out);
  const inBraces = bracket === "{" || bracket === "{pattern";
  if (previous?.text === "." || previous?.text === "?.") {
    NEXT_IS_CALL.lastIndex = pos + name.length;
    return NEXT_IS_CALL.test(code) ? "function" : "property-name";
  }
  // An object or type literal key, including keyword names (`{ default: x }`).
  if (inBraces && (!previous || BEFORE_KEY.has(previous.text))) {
    NEXT_IS_KEY_COLON.lastIndex = pos + name.length;
    if (NEXT_IS_KEY_COLON.test(code)) return "property-name";
  }
  // A parameter name, not its type annotation or default value.
  if (bracket === "(pattern") {
    if (
      previous &&
      BEFORE_PARAM.has(previous.text) &&
      !UPPERCASE.test(name) &&
      !TS_PRIMITIVES.has(name) &&
      !KEYWORDS.has(name) &&
      name !== "this"
    ) {
      return "definition";
    }
  } else if (
    // A name a destructuring pattern declares, not a default value after `=`.
    bracket?.endsWith("pattern") &&
    previous?.text !== "=" &&
    !NEXT_IS_MEMBER.test(code.slice(pos + name.length, pos + name.length + 2))
  ) {
    return "definition";
  }
  // `$: doubled = count * 2` declares `doubled`.
  if (previous?.text === "$:") {
    NEXT_IS_ASSIGN.lastIndex = pos + name.length;
    if (NEXT_IS_ASSIGN.test(code)) return "definition";
  }
  // `$state(0)` is a rune; `$count` and `$$restProps` are Svelte's own.
  if (svelte && name.length > 1 && name[0] === "$") {
    return RUNES.has(name) ? "keyword" : "special";
  }
  if (CONTROL.has(name)) return "control-keyword";
  if (MODULE.has(name)) return "module-keyword";
  if (DEFINITION.has(name)) return "definition-keyword";
  if (KEYWORDS.has(name)) return "keyword";
  if (name === "true" || name === "false") return "bool";
  if (name === "null" || name === "undefined") return "null";
  if (name === "this" || name === "super") return "self";
  if (previous?.type === "definition-keyword") return "definition";
  // A single arrow parameter, `x => x * 2`.
  NEXT_IS_ARROW.lastIndex = pos + name.length;
  if (NEXT_IS_ARROW.test(code)) return "definition";
  NEXT_IS_CALL.lastIndex = pos + name.length;
  if (NEXT_IS_CALL.test(code)) return "function";
  // A template tag, html`…`.
  NEXT_IS_TEMPLATE.lastIndex = pos + name.length;
  if (NEXT_IS_TEMPLATE.test(code)) return "function";
  if (UPPERCASE.test(name)) return "type-name";
  // TypeScript's built-in types, in a type position: `role: string`.
  if (TS_PRIMITIVES.has(name) && previous && TYPE_POSITION.has(previous.text)) {
    return "type-name";
  }
  return null;
}
const CSS_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y;
const SCSS_LINE_COMMENT = /\/\/[^\n]*/y;
const CSS_STRING = /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/y;
const CSS_NUMBER = /-?(?:\d+\.?\d*|\.\d+)/y;
const CSS_UNIT = /%|[a-z]+/iy;
const CSS_COLOR = /#[\da-f]{3,8}\b/iy;
const CSS_AT_RULE = /@[\w-]+/y;
const CSS_IDENT = /-?-?[A-Za-z_][\w-]*/y;
const CSS_SELECTOR_MARK = /[.#:]{1,2}-?[A-Za-z_][\w-]*/y;
const SCSS_VARIABLE = /\$[\w-]+/y;
const CSS_IMPORTANT = /!\s*important\b/iy;
/** Attribute selector operators and combinators: `^=`, `>`, `+`, `~`, `*`. */
const CSS_OPERATOR = /[~|^$*]?=|[>+~*]/y;
const SCSS_INTERPOLATION = /#\{[^}]*\}?/y;
const CSS_STATEMENT_END = new Set(["{", ";", "}"]);
/**
 * Whether the statement starting at `at` is a selector: it reaches `{`
 * before `;` or `}`, outside parentheses, strings, and comments, and isn't
 * an at-rule. Statements are scanned once each, so a whole sheet stays
 * linear.
 * @param {string} code
 * @param {number} at
 * @param {boolean} scss
 */
function selectorAhead(code, at, scss) {
  let depth = 0;
  let first = true;
  for (let i = at; i < code.length; i++) {
    const c = code[i];
    if (c === "/" && code[i + 1] === "*") {
      const close = code.indexOf("*/", i + 2);
      if (close < 0) return false;
      i = close + 1;
    } else if (scss && c === "/" && code[i + 1] === "/") {
      const newline = code.indexOf("\n", i);
      if (newline < 0) return false;
      i = newline;
    } else if (c === '"' || c === "'") {
      const close = code.indexOf(c, i + 1);
      if (close < 0) return false;
      i = close;
    } else if (first && c === "@") {
      return false;
    } else if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && CSS_STATEMENT_END.has(c)) {
      // `#{…}` interpolation is part of the statement, not its end.
      if (scss && c === "{" && code[i - 1] === "#") {
        const close = code.indexOf("}", i);
        if (close < 0) return false;
        i = close;
        continue;
      }
      return c === "{";
    }
    if (first && !WHITESPACE_CHAR.test(c)) first = false;
  }
  return false;
}
const WHITESPACE_CHAR = /\s/;
/**
 * @param {string} text
 * @param {number} at
 * @param {CssState} state
 * @returns {TokenType | null}
 */
function cssIdentifier(text, at, state) {
  if (state.attribute === "name") return "attribute-name";
  if (state.attribute === "value") return "attribute-value";
  NEXT_IS_CALL.lastIndex = at + text.length;
  if (NEXT_IS_CALL.test(state.code)) return "function";
  if (state.selector) return "tag-name";
  NEXT_IS_COLON.lastIndex = at + text.length;
  if (NEXT_IS_COLON.test(state.code)) return "property-name";
  return text.startsWith("--") ? "variable-name" : null;
}
/** @type {Rule<CssState>[]} */
const CSS_RULES = [
  [WHITESPACE, null],
  [CSS_COMMENT, "comment"],
  [SCSS_LINE_COMMENT, "comment", (state) => state.scss],
  [SCSS_INTERPOLATION, "special", (state) => state.scss],
  [SCSS_VARIABLE, "variable-name", (state) => state.scss],
  [
    CSS_STRING,
    (_text, _at, state) =>
      state.attribute === "value" ? "attribute-value" : "string",
  ],
  [CSS_AT_RULE, "keyword"],
  [CSS_IMPORTANT, "keyword"],
  [CSS_COLOR, "color", (state) => !state.selector],
  [
    CSS_SELECTOR_MARK,
    (text) => (text[0] === ":" ? "special" : "class-name"),
    (state) => state.selector,
  ],
  [CSS_NUMBER, "number", (state) => !state.selector],
  [CSS_UNIT, "unit", (state) => state.number],
  [CSS_IDENT, cssIdentifier],
  [CSS_OPERATOR, "operator"],
  [PUNCTUATION, (text) => punctuationType(text)],
];
/**
 * CSS, or SCSS with `scss`. Nested rules (CSS nesting, SCSS) and the rules
 * inside `@media` and the like read as selectors.
 * @param {string} code
 * @param {Token[]} out
 * @param {boolean} [scss]
 */
function lexCss(code, out, scss = false) {
  /** @type {CssState} */
  const state = {
    code,
    selector: selectorAhead(code, 0, scss),
    number: false,
    attribute: "",
    scss,
  };
  runRules(code, out, CSS_RULES, state, (token, state, at) => {
    if (CSS_STATEMENT_END.has(token.text)) {
      state.selector = selectorAhead(code, at + token.text.length, scss);
      state.attribute = "";
    } else if (state.selector && token.text === "[") {
      state.attribute = "name";
    } else if (token.text === "]") {
      state.attribute = "";
    } else if (state.attribute === "name" && token.type === "operator") {
      state.attribute = "value";
    }
    state.number = token.type === "number";
  });
}
/** @type {Lexer} */
const lexScss = (code, out) => lexCss(code, out, true);
const MARKUP_COMMENT = /<!--[\s\S]*?(?:-->|$)/y;
const TAG_OPEN = /<\/?(?=[A-Za-z])/y;
const DOCTYPE = /<![A-Za-z][^>]*>?/y;
const TAG_NAME = /[A-Za-z][\w.:-]*/y;
const ATTRIBUTE_NAME = /[^\s=/>{"']+/y;
const QUOTED = /"[^"]*"?|'[^']*'?/y;
const UNQUOTED = /[^\s>"'`=<]+/y;
const BLOCK_TAG = /[#:/@][A-Za-z]+/y;
const TEXT = /[^<{]+/y;
const ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi;
const IDENTIFIER_TEXT = /^[A-Za-z_$][\w$]*$/;
/** `on:click|once`, `bind:value`, `transition:fade|local`, … */
const DIRECTIVE =
  /^(on|bind|class|style|use|transition|in|out|animate|let):(.+)$/;
const SCSS_LANG = /^["']?s[ac]ss["']?$/i;
/**
 * Bracket depth of each token in `tokens[from..]`, relative to the first.
 * @param {Token[]} tokens
 * @param {number} from
 */
function depths(tokens, from) {
  /** @type {number[]} */
  const result = [];
  let depth = 0;
  for (let i = from; i < tokens.length; i++) {
    const { text } = tokens[i];
    if (CLOSE_BRACKETS.has(text)) depth--;
    result.push(depth);
    if (OPEN_BRACKETS.has(text)) depth++;
  }
  return result;
}
/**
 * Marks the names a binding pattern declares, in `tokens[from..to)`:
 * `item`, `{ id, name }`, `[a, b]`, `{ id: renamed }`. Keys, types, and
 * default values keep their colors.
 * @param {Token[]} tokens
 * @param {number} from
 * @param {number} to
 */
function definePattern(tokens, from, to) {
  for (let i = from; i < to; i++) {
    const token = tokens[i];
    if (
      (token.type === null || token.type === "function") &&
      IDENTIFIER_TEXT.test(token.text) &&
      lastSignificant(tokens, i)?.text !== "="
    ) {
      token.type = "definition";
    }
  }
}
/**
 * Index of the first token in `tokens[from..]` at bracket depth 0 that
 * `match` accepts, or `tokens.length`.
 * @param {Token[]} tokens
 * @param {number} from
 * @param {(token: Token) => boolean} match
 */
function findTopLevel(tokens, from, match) {
  const levels = depths(tokens, from);
  for (let i = from; i < tokens.length; i++) {
    if (levels[i - from] === 0 && match(tokens[i])) return i;
  }
  return tokens.length;
}
/**
 * Colors the names a block or tag declares, in its tokens `tokens[from..]`:
 * `{#each items as item, i (item.id)}`, `{#each items, i}`,
 * `{#await p then value}`, `{:then value}`, `{:catch error}`,
 * `{#snippet row(item)}`, and `{@const total = a + b}`.
 * @param {string} block - `#each`, `:then`, …
 * @param {Token[]} tokens
 * @param {number} from
 */
function defineBlockNames(block, tokens, from) {
  const end = tokens.length;
  if (block === "#each") {
    const as = findTopLevel(
      tokens,
      from,
      (t) => t.text === "as" && t.type === "keyword",
    );
    // Svelte 5 allows `{#each items, i}` without `as`.
    const start =
      as < end ? as + 1 : findTopLevel(tokens, from, (t) => t.text === ",");
    const key = findTopLevel(tokens, start, (t) => t.text === "(");
    definePattern(tokens, start, key);
  } else if (block === ":then" || block === ":catch") {
    definePattern(tokens, from, end);
  } else if (block === "#await") {
    // `then` and `catch` as words, not `p.then(…)`.
    const then = findTopLevel(
      tokens,
      from,
      (t) =>
        (t.text === "then" && t.type === null) ||
        (t.text === "catch" && t.type === "control-keyword"),
    );
    if (then < end) {
      tokens[then].type = "control-keyword";
      definePattern(tokens, then + 1, end);
    }
  } else if (block === "#snippet") {
    definePattern(tokens, from, end);
  } else if (block === "@const") {
    const equals = findTopLevel(tokens, from, (t) => t.text === "=");
    definePattern(tokens, from, equals);
  }
}
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
  const from = out.length;
  lexScript(inner, out, true);
  if (block) defineBlockNames(block, out, from);
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
 * An attribute name, with a directive split into its prefix, name, and
 * modifiers: `on` `:` `click` `|` `preventDefault`.
 * @param {string} name
 * @param {Token[]} out
 */
function pushAttributeName(name, out) {
  const directive = DIRECTIVE.exec(name);
  if (!directive) {
    out.push({ type: "attribute-name", text: name });
    return;
  }
  out.push({ type: "keyword", text: directive[1] });
  out.push({ type: "punctuation", text: ":" });
  const [target, ...modifiers] = directive[2].split("|");
  out.push({ type: "attribute-name", text: target });
  for (const modifier of modifiers) {
    out.push({ type: "operator", text: "|" });
    if (modifier) out.push({ type: "modifier", text: modifier });
  }
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
    if (name && code[pos] !== "=") {
      pushAttributeName(name, out);
      pos += name.length;
      continue;
    }
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
          : { type: null, text: code[pos] };
    out.push(token);
    pos += token.text.length;
  }
  return pos;
}
/**
 * Text between tags, with character references (`&amp;`) split out.
 * @param {string} text
 * @param {Token[]} out
 */
function pushText(text, out) {
  let last = 0;
  if (text.includes("&")) {
    for (const match of text.matchAll(ENTITY)) {
      const at = match.index ?? 0;
      if (at > last) out.push({ type: null, text: text.slice(last, at) });
      out.push({ type: "character", text: match[0] });
      last = at + match[0].length;
    }
  }
  if (last < text.length) out.push({ type: null, text: text.slice(last) });
}
/**
 * Whether the tag whose attribute tokens are `tokens[from..]` has
 * `lang="scss"` (or `sass`).
 * @param {Token[]} tokens
 * @param {number} from
 */
function hasScssLang(tokens, from) {
  for (let i = from; i < tokens.length - 2; i++) {
    if (
      tokens[i].type === "attribute-name" &&
      (tokens[i].text === "lang" || tokens[i].text === "type") &&
      tokens[i + 1].text === "=" &&
      SCSS_LANG.test(tokens[i + 2].text.replace("text/", ""))
    ) {
      return true;
    }
  }
  return false;
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
    const doctype = sticky(DOCTYPE, code, pos);
    if (doctype) {
      out.push({ type: "meta", text: doctype });
      pos += doctype.length;
      continue;
    }
    const open = sticky(TAG_OPEN, code, pos);
    if (!open) {
      const text = sticky(TEXT, code, pos) ?? code[pos];
      pushText(text, out);
      pos += text.length;
      continue;
    }
    out.push({ type: "angle-bracket", text: open });
    pos += open.length;
    const name = sticky(TAG_NAME, code, pos) ?? "";
    out.push({ type: "tag-name", text: name });
    const attributes = out.length;
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
      const body = code.slice(pos, stop);
      if (lower === "script") lexScript(body, out, true);
      else lexCss(body, out, hasScssLang(out, attributes));
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
// Comment, string, variable, flag, operator (a command follows), `)`, word,
// whitespace, and any other single character, so no text is dropped.
const SHELL_TOKEN =
  /(#.*)|("(?:\\.|[^"\\])*"?|'[^']*'?)|(\$\{[^}]*\}?|\$[\w@*#?$!-]+)|(\s--?[\w-]+(?:=\S*)?)|(\$\(|\|\|?|&&|;|>>?|<|&)|(\))|([^\s"'$|&;<>#()]+)|(\s+)|([\s\S])/g;
const SHELL_ASSIGNMENT = /^([A-Za-z_]\w*)=([\s\S]*)$/;
const SPACE_BEFORE = /\s/;
const DIFF_HEADER =
  /^(?:diff |index |--- |\+\+\+ |new file|deleted file|similarity|rename |old mode|new mode)/;
/** @type {Lexer} */
const lexShell = (code, out) => {
  for (const line of code.match(SHELL_LINE) ?? []) {
    let command = true;
    for (const m of line.matchAll(SHELL_TOKEN)) {
      const [text, comment, string, variable, flag, operator, close, word] = m;
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
      } else if (close !== undefined) {
        out.push({ type: "operator", text });
      } else if (word === undefined) {
        out.push({ type: null, text });
      } else {
        // `NODE_ENV=production bun run build`: assignments, then the command.
        const assignment = command ? SHELL_ASSIGNMENT.exec(word) : null;
        if (assignment) {
          out.push({ type: "variable-name", text: assignment[1] });
          out.push({ type: "operator", text: "=" });
          if (assignment[2]) out.push({ type: null, text: assignment[2] });
        } else {
          out.push({ type: command ? "function" : null, text });
          command = false;
        }
      }
    }
  }
};
/** @type {Lexer} */
const lexDiff = (code, out) => {
  // File headers (`diff --git`, `index`, `---`, `+++`) come before a file's
  // first `@@` hunk; inside hunks, `-` and `+` lines are changes.
  let header = true;
  for (const line of code.match(SHELL_LINE) ?? []) {
    if (!line) continue;
    if (line.startsWith("diff ")) header = true;
    else if (line.startsWith("@@")) header = false;
    const type =
      header && DIFF_HEADER.test(line)
        ? "meta"
        : line.startsWith("@@")
          ? "meta"
          : line.startsWith("+")
            ? "inserted"
            : line.startsWith("-")
              ? "deleted"
              : null;
    out.push({ type, text: line });
  }
};
/**
 * The characters each rule pattern can start with. `runRules` only tries
 * the rules that can match the next character, so a position runs one or
 * two patterns instead of every rule's. Patterns not listed are always
 * tried.
 * @type {Map<RegExp, RegExp>}
 */
const FIRST_CHAR = new Map([
  [WHITESPACE, /\s/],
  [JS_COMMENT, /\//],
  [JS_REGEXP, /\//],
  [JS_STRING, /[`"']/],
  [JS_NUMBER, /[\d.]/],
  [REACTIVE_LABEL, /\$/],
  [IDENTIFIER, /[A-Za-z_$]/],
  [JS_OPERATOR, /[=+\-.?!<>&|*%^~:/]/],
  [PUNCTUATION, /[{}()[\];,.:]/],
  [CSS_COMMENT, /\//],
  [SCSS_LINE_COMMENT, /\//],
  [SCSS_INTERPOLATION, /#/],
  [SCSS_VARIABLE, /\$/],
  [CSS_STRING, /["']/],
  [CSS_AT_RULE, /@/],
  [CSS_COLOR, /#/],
  [CSS_SELECTOR_MARK, /[.#:]/],
  [CSS_NUMBER, /[-\d.]/],
  [CSS_UNIT, /[%A-Za-z]/],
  [CSS_IDENT, /[-A-Za-z_]/],
  [JSON_STRING, /"/],
  [PRIVATE_NAME, /#/],
  [DECORATOR, /@/],
  [CSS_IMPORTANT, /!/],
  [CSS_OPERATOR, /[~|^$*=>+]/],
]);
/** @type {WeakMap<object, Rule<any>[][]>} */
const DISPATCH = new WeakMap();
/**
 * `rules` filtered by first character, for each ASCII character code.
 * @template S
 * @param {Rule<S>[]} rules
 * @returns {Rule<S>[][]}
 */
function dispatchTable(rules) {
  let table = DISPATCH.get(rules);
  if (!table) {
    table = Array.from({ length: 128 }, (_, code) =>
      rules.filter(([pattern]) => {
        const first = FIRST_CHAR.get(pattern);
        return !first || first.test(String.fromCharCode(code));
      }),
    );
    DISPATCH.set(rules, table);
  }
  return table;
}
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
  scss: lexScss,
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
 * @param {string} lang - `js`, `ts`, `svelte` (Svelte 4 and 5), `html`, `css`, `scss`, `json`, `bash`, `diff`, and aliases
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
