/**
 * Provably dead declarations for scripts/check-css-overrides.ts.
 *
 * A declaration is dead when every selector of its rule is repeated, in the
 * same media/supports context, by a later rule that sets the same property
 * (or a shorthand covering it) with at least the same importance. Both rules
 * match exactly the same elements at equal specificity, so source order alone
 * decides and the earlier declaration can never win. No DOM is needed.
 *
 * A property repeated inside one rule is dead too, unless the pair is a
 * progressive-enhancement fallback (see FALLBACK_VALUE_RE).
 */

import type { CssNode } from "css-tree";
import { generate, parse, walk } from "css-tree";

export interface DeadDeclaration {
  context: string;
  selector: string;
  property: string;
  value: string;
  /** The declaration that always wins instead. */
  by: { property: string; value: string; sameRule: boolean };
  /** Start of the dead declaration (1-based line, 0-based column). */
  loc?: { line: number; column: number };
}

// Values some baseline browser drops, so an earlier declaration is a fallback.
const FALLBACK_VALUE_RE =
  /(^|[\s(,])-(webkit|moz|ms)-|fit-content|\d[dsl]v[hw]\b|color-mix\(|\bstretch\b/;

// Longhands a shorthand resets, as property-name patterns.
const SHORTHANDS: [string, RegExp][] = [
  ["padding", /^padding-(top|right|bottom|left)$/],
  ["margin", /^margin-(top|right|bottom|left)$/],
  ["inset", /^(top|right|bottom|left)$/],
  ["outline", /^outline-(width|style|color)$/],
  ["overflow", /^overflow-[xy]$/],
  ["flex", /^flex-(grow|shrink|basis)$/],
  ["transition", /^transition-(property|duration|delay|timing-function)$/],
  [
    "background",
    /^background-(color|image|position|size|repeat|attachment|origin|clip)$/,
  ],
  [
    "border",
    /^border-((top|right|bottom|left)(-(width|style|color))?|width|style|color)$/,
  ],
  ["border-width", /^border-(top|right|bottom|left)-width$/],
  ["border-style", /^border-(top|right|bottom|left)-style$/],
  ["border-color", /^border-(top|right|bottom|left)-color$/],
  ["border-radius", /^border-(top|bottom)-(left|right)-radius$/],
];

export function covers(later: string, earlier: string): boolean {
  if (later === earlier) return true;
  if (later.startsWith("--") || earlier.startsWith("--")) return false;
  return SHORTHANDS.some(([short, re]) => short === later && re.test(earlier));
}

interface Decl {
  property: string;
  value: string;
  important: boolean;
  loc?: DeadDeclaration["loc"];
}

interface Block {
  context: string;
  selectors: string[];
  decls: Decl[];
}

function blocksOf(css: string, positions: boolean): Block[] {
  const blocks: Block[] = [];
  const context: string[] = [];
  walk(parse(css, { positions }), {
    enter(node: CssNode) {
      if (node.type === "Atrule" && node.block) {
        context.push(
          `@${node.name} ${node.prelude ? generate(node.prelude) : ""}`.trim(),
        );
      }
      if (node.type !== "Rule" || node.prelude.type !== "SelectorList") return;
      if (context.some((c) => c.includes("keyframes"))) return;
      const decls: Decl[] = [];
      for (const d of node.block.children) {
        if (d.type !== "Declaration") continue;
        decls.push({
          property: d.property.startsWith("--")
            ? d.property
            : d.property.toLowerCase(),
          value: generate(d.value),
          important: Boolean(d.important),
          loc: d.loc
            ? { line: d.loc.start.line, column: d.loc.start.column - 1 }
            : undefined,
        });
      }
      blocks.push({
        context: context.join(" / "),
        selectors: node.prelude.children.toArray().map((s) => generate(s)),
        decls,
      });
    },
    leave(node: CssNode) {
      if (node.type === "Atrule" && node.block) context.pop();
    },
  });
  return blocks;
}

const beats = (later: Decl, earlier: Decl): boolean =>
  covers(later.property, earlier.property) &&
  (later.important || !earlier.important);

export function deadDeclarations(
  css: string,
  positions = false,
): DeadDeclaration[] {
  const blocks = blocksOf(css, positions);
  // context + selector -> indexes of the blocks listing that selector
  const bySelector = new Map<string, number[]>();
  blocks.forEach((block, i) => {
    for (const selector of block.selectors) {
      const key = `${block.context}\0${selector}`;
      const list = bySelector.get(key);
      if (list) list.push(i);
      else bySelector.set(key, [i]);
    }
  });

  const dead: DeadDeclaration[] = [];
  blocks.forEach((block, i) => {
    block.decls.forEach((decl, d) => {
      const report = (by: Decl, sameRule: boolean) =>
        dead.push({
          context: block.context,
          selector: block.selectors.join(","),
          property: decl.property,
          value: decl.value,
          by: { property: by.property, value: by.value, sameRule },
          loc: decl.loc,
        });

      const sibling = block.decls.slice(d + 1).find((o) => beats(o, decl));
      if (sibling) {
        const fallback =
          sibling.property === decl.property &&
          (FALLBACK_VALUE_RE.test(sibling.value) ||
            FALLBACK_VALUE_RE.test(decl.value));
        if (!fallback) report(sibling, true);
        return;
      }

      let winner: Decl | undefined;
      const everySelectorOverridden = block.selectors.every((selector) => {
        const later = bySelector
          .get(`${block.context}\0${selector}`)
          ?.filter((j) => j > i);
        return later?.some((j) => {
          const hit = blocks[j].decls.find((o) => beats(o, decl));
          if (hit) winner ??= hit;
          return Boolean(hit);
        });
      });
      if (everySelectorOverridden && winner) report(winner, false);
    });
  });
  return dead;
}
