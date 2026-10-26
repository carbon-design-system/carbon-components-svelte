// @vitest-environment node
import {
  fluidDisplay01,
  fluidDisplay02,
  fluidDisplay03,
  fluidDisplay04,
  fluidHeading03,
  fluidHeading04,
  fluidHeading05,
  fluidHeading06,
  fluidParagraph01,
  fluidQuotation01,
  fluidQuotation02,
} from "@carbon/type";
import { parseRules } from "crassus";
import { compileEntry } from "./compile";

// The fluid type styles are vendored as Sass maps. Check what all.css
// renders at each breakpoint against @carbon/type's exported styles, so a
// value that drifts from v11 fails here.

const BREAKPOINTS = { sm: 20, md: 42, lg: 66, xlg: 82, max: 99 } as const;
type Breakpoint = keyof typeof BREAKPOINTS;
const PROPS = ["font-size", "font-weight", "line-height", "letter-spacing"];

type Style = {
  breakpoints?: Partial<Record<Breakpoint, Record<string, unknown>>>;
  [property: string]: unknown;
};

// `fluidHeading04` -> `fluid-heading-04`
const kebab = (name: string) =>
  name.replace(/[A-Z]|\d+/g, (part) => `-${part.toLowerCase()}`);

// A length in px. A fluid `calc()` is read at the viewport width.
function toPx(value: string, widthPx: number): number {
  const tokens =
    value.replace(/^calc/, "").match(/\d*\.?\d+(?:vw|rem|px)?|[-+*/()]/g) ?? [];
  let i = 0;
  const unit = (token: string) => {
    const n = Number.parseFloat(token);
    if (token.endsWith("vw")) return (n * widthPx) / 100;
    if (token.endsWith("rem")) return n * 16;
    return n;
  };
  const factor = (): number => {
    const token = tokens[i++];
    if (token === "-") return -factor();
    if (token === "(") {
      const n = sum();
      i++;
      return n;
    }
    return unit(token);
  };
  const product = (): number => {
    let n = factor();
    while (tokens[i] === "*" || tokens[i] === "/") {
      n = tokens[i++] === "*" ? n * factor() : n / factor();
    }
    return n;
  };
  const sum = (): number => {
    let n = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      n = tokens[i++] === "+" ? n + product() : n - product();
    }
    return n;
  };
  return sum();
}

function normalize(prop: string, value: unknown, widthPx: number) {
  const text = String(value);
  if (prop === "font-size" || prop === "letter-spacing") {
    return Math.round(toPx(text, widthPx) * 100) / 100;
  }
  return Number(text);
}

const styles = Object.entries<Style>({
  fluidHeading03,
  fluidHeading04,
  fluidHeading05,
  fluidHeading06,
  fluidParagraph01,
  fluidQuotation01,
  fluidQuotation02,
  fluidDisplay01,
  fluidDisplay02,
  fluidDisplay03,
  fluidDisplay04,
}).map(([name, style]) => [kebab(name), style] as const);

describe("fluid type styles", () => {
  it("render @carbon/type's values at every breakpoint", async () => {
    const rules = parseRules(await compileEntry("all.scss"));
    const mismatches: string[] = [];
    let compared = 0;

    for (const [name, style] of styles) {
      const selector = `.bx--type-${name}`;
      const ruleAt = (rem: number) =>
        rules.filter(
          (rule) =>
            rule.selector === selector &&
            (rule.context === "" ||
              Number(rule.context.match(/min-width:\s*([\d.]+)rem/)?.[1]) <=
                rem),
        );

      // At each breakpoint the style lists, v11's value is the base merged
      // with every breakpoint up to it.
      const { breakpoints = {}, ...base } = style;
      const expected: Record<string, unknown> = { ...base };
      for (const [bp, rem] of Object.entries(BREAKPOINTS)) {
        const own = breakpoints[bp as Breakpoint];
        Object.assign(expected, own);
        // Between two of the style's breakpoints the size is interpolated.
        if (bp !== "sm" && !own) continue;
        const widthPx = rem * 16;
        const actual = new Map<string, string>();
        for (const rule of ruleAt(rem)) {
          for (const [prop, value] of rule.decls)
            actual.set(prop, String(value));
        }
        for (const prop of PROPS) {
          const want =
            expected[prop.replace(/-(\w)/g, (_, c) => c.toUpperCase())];
          if (want === undefined) continue;
          const have = actual.get(prop);
          compared++;
          if (
            have === undefined ||
            normalize(prop, have, widthPx) !== normalize(prop, want, widthPx)
          ) {
            mismatches.push(`${name} ${bp} ${prop}: ${have} (v11 ${want})`);
          }
        }
      }
    }

    expect(compared).toBeGreaterThan(150);
    expect(mismatches).toEqual([]);
  }, 30_000);
});
