import { parse } from "svelte/compiler";

/**
 * Finds English that a component's markup hard-codes. Every visible or
 * announced string is a prop (COMPONENT_GUIDELINES, "Strings as props"), so
 * the markup holds none.
 *
 * Three kinds of hit:
 * - `text`: a literal text node, such as `<span>Cancel</span>` or the
 *   fallback of `<slot>Cancel</slot>`.
 * - `attribute`: a literal `aria-label`, `title`, `placeholder` or `alt`.
 * - `expression`: a string literal inside the expression of one of those
 *   attributes or of a `{...}` tag, such as `aria-label={label ?? "Close"}`.
 *   These are defaults a `*Text` prop should hold.
 *
 * The parse uses the legacy AST, which Svelte 3, 4 and 5 all return.
 */
export type Hit = {
  kind: "text" | "attribute" | "expression";
  line: number;
  text: string;
};

type Node = { type?: string; start?: number; [key: string]: unknown };

const ATTRIBUTES = new Set(["aria-label", "title", "placeholder", "alt"]);
const CHILD_KEYS = ["children", "else", "pending", "then", "catch"];
const LETTERS = /\p{L}{2,}/u;
const WHITESPACE = /\s+/g;
const ONE_WORD = /^[\p{L}][\p{L}'’]*[.,!?…:]*$/u;
const CAMEL_CASE = /[a-z][A-Z]/;
const COMPARISON = /^[!=]==?$/;

/**
 * Whether `value` reads as English text: two letters in a row, and either
 * more than one word or a plain word. Tokens (`aria-label`, `collapseAll`,
 * `bx--tag`), numbers, units, paths and punctuation do not.
 */
export function looksEnglish(value: string): boolean {
  const text = value.replace(WHITESPACE, " ").trim();
  if (!LETTERS.test(text)) return false;
  if (text.includes(" ")) return true;
  if (CAMEL_CASE.test(text)) return false;
  return ONE_WORD.test(text);
}

function stringLiterals(node: unknown, found: Node[] = []): Node[] {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) {
    for (const item of node) stringLiterals(item, found);
    return found;
  }
  const n = node as Node;
  // `x === "open"` compares; it shows nothing.
  if (n.type === "BinaryExpression" && COMPARISON.test(String(n.operator))) {
    return found;
  }
  if (n.type === "Literal" && typeof n.value === "string") found.push(n);
  if (n.type === "TemplateElement") {
    found.push({ ...n, value: (n.value as { cooked: string }).cooked });
  }
  for (const [key, value] of Object.entries(n)) {
    if (key === "start" || key === "end" || key === "type") continue;
    // `props["aria-label"]` and `{ key: ... }` name things; they show nothing.
    if (key === "property" && n.type === "MemberExpression") continue;
    if (key === "key" && !n.computed) continue;
    stringLiterals(value, found);
  }
  return found;
}

/** The English that `source`, the text of a `.svelte` file, hard-codes. */
export function findHardCodedEnglish(source: string): Hit[] {
  const hits: Hit[] = [];
  const lineOf = (offset: number) => source.slice(0, offset).split("\n").length;
  const add = (kind: Hit["kind"], node: Node, text: string) => {
    if (looksEnglish(text)) {
      hits.push({
        kind,
        line: lineOf(node.start ?? 0),
        text: text.replace(WHITESPACE, " ").trim(),
      });
    }
  };

  function walk(node: unknown): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const n = node as Node;
    if (n.type === "Element" && (n.name === "script" || n.name === "style")) {
      return;
    }
    if (n.type === "Text") {
      add("text", n, String(n.data));
      return;
    }
    if (n.type === "MustacheTag") {
      for (const literal of stringLiterals(n.expression)) {
        add("expression", literal, String(literal.value));
      }
    }
    if (Array.isArray(n.attributes)) {
      for (const attribute of n.attributes as Node[]) {
        if (
          attribute.type !== "Attribute" ||
          !ATTRIBUTES.has(String(attribute.name)) ||
          !Array.isArray(attribute.value)
        ) {
          continue;
        }
        for (const part of attribute.value as Node[]) {
          if (part.type === "Text") add("attribute", part, String(part.data));
          else if (part.type === "MustacheTag") {
            for (const literal of stringLiterals(part.expression)) {
              add("expression", literal, String(literal.value));
            }
          }
        }
      }
    }
    for (const key of CHILD_KEYS) walk(n[key]);
  }

  walk((parse(source) as unknown as { html: Node }).html);
  return hits;
}
