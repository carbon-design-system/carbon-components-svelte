// @vitest-environment node
// @depends-on src/**

// On an element with a spread, Svelte 3 and 4 fold every attribute into it,
// and their server `spread` writes a `true` value as a bare attribute:
// `aria-hidden` rather than `aria-hidden="true"`, which assistive technology
// reads as unset until hydration. Boolean ARIA states there are strings.
const sources = import.meta.glob<string>("../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const BOOLEAN_STATES = new Set([
  "atomic",
  "busy",
  "checked",
  "disabled",
  "expanded",
  "hidden",
  "invalid",
  "modal",
  "multiline",
  "multiselectable",
  "pressed",
  "readonly",
  "required",
  "selected",
]);

/** The end of a `{…}` expression starting after `{` at `from`. */
function closingBrace(source: string, from: number) {
  let depth = 1;
  let quote = "";
  let i = from;
  for (; i < source.length && depth > 0; i++) {
    const c = source[i];
    if (quote) {
      if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
  }
  return i;
}

/** Each lowercase element's attribute text. */
function* elements(source: string) {
  const open = /<[a-z][a-z0-9-]*\b/g;
  for (const match of source.matchAll(open)) {
    let i = match.index + match[0].length;
    let quote = "";
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === quote) quote = "";
      } else if (c === '"') quote = c;
      else if (c === "{") i = closingBrace(source, i + 1) - 1;
      else if (c === ">") break;
    }
    yield source.slice(match.index + match[0].length, i);
  }
}

/** Whether an expression can evaluate to the boolean `true`. */
const MAY_BE_TRUE = [
  /\|\|\s*undefined$/,
  /\?\s*true\s*:/,
  /:\s*true$/,
  /^!?[A-Za-z_$][\w$]*$/,
];

describe("boolean ARIA states", () => {
  it("are strings on elements with a spread", () => {
    const found: string[] = [];
    // What the scan saw, so it fails if the patterns stop matching.
    let objectStates = 0;
    let spreadElements = 0;
    let spreadStates = 0;
    for (const [path, source] of Object.entries(sources)) {
      for (const [, name, value] of source.matchAll(
        /"aria-([a-z]+)":\s*([^,\n}]+)/g,
      )) {
        if (!BOOLEAN_STATES.has(name)) continue;
        objectStates++;
        if (/(?<!")\btrue\b(?!")/.test(value)) {
          found.push(`${path}: aria-${name}: ${value.trim()}`);
        }
      }
      for (const attributes of elements(source)) {
        if (!attributes.includes("{...")) continue;
        spreadElements++;
        for (const match of attributes.matchAll(/\saria-([a-z]+)=\{/g)) {
          if (!BOOLEAN_STATES.has(match[1])) continue;
          spreadStates++;
          const start = match.index + match[0].length;
          const value = attributes
            .slice(start, closingBrace(attributes, start) - 1)
            .trim();
          if (MAY_BE_TRUE.some((pattern) => pattern.test(value))) {
            found.push(`${path}: aria-${match[1]}={${value}}`);
          }
        }
      }
    }
    expect(objectStates).toBeGreaterThan(100);
    expect(spreadElements).toBeGreaterThan(300);
    expect(spreadStates).toBeGreaterThan(50);
    expect(found).toEqual([]);
  });
});
