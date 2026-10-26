import type { GraphView, Narrower } from "bivium";

const BUILT_CSS = /^css\/([^/]+)\.css$/;
// Where the classes a fixture page renders are spelled.
const PAGE_SOURCE = /^(?:src|e2e)\//;

// The compiled stylesheets some e2e test loads. A sheet counts through the
// files that import it, not through `css/**` globs that match its path.
function stylesheetEntries(graph: GraphView<"unit" | "e2e">): string[] {
  const tests = graph.tests("e2e");
  const entries: string[] = [];
  for (const node of graph.nodes()) {
    const entry = BUILT_CSS.exec(node)?.[1];
    if (entry === undefined) continue;
    const reach = graph.dependents(graph.importers(node));
    if (tests.some((test) => reach.has(test))) entries.push(entry);
  }
  return entries.sort();
}

/**
 * A `css/` change compiles the stylesheets e2e pages load at the merge base
 * and in the working tree, diffs their rules, and seeds the e2e walk with the
 * sources that spell each changed rule's rarest required class (see
 * css-delta.ts). crassus needs the install a `css/` change does, so the tools
 * load only when the narrower runs.
 */
export const cssNarrower: Narrower<"unit" | "e2e"> = {
  name: "css/",
  match: "css/**",
  opaque: "css/*.css",
  suites: ["e2e"],
  async narrow({ root, base, head, graph }) {
    const entries = stylesheetEntries(graph);
    try {
      const [{ changedSelectors, selectorSources }, { compileAt }] =
        await Promise.all([import("./css-delta"), import("crassus/git")]);
      const [before, after] = await Promise.all([
        compileAt(base.commit, { cwd: root, entries }),
        compileAt(head.commit, { cwd: root, entries }),
      ]);
      const selectors = new Set<string>();
      for (const entry of entries) {
        const was = before.sheets[entry]?.css;
        const now = after.sheets[entry]?.css;
        if (was === undefined || now === undefined) {
          return { all: `${entry}.css: not compiled` };
        }
        const change = changedSelectors(was, now);
        if ("reason" in change)
          return { all: `${entry}.css: ${change.reason}` };
        for (const selector of change.selectors) selectors.add(selector);
      }
      const files = graph
        .nodes()
        .filter((node) => PAGE_SOURCE.test(node) && !node.includes("#"));
      const texts = await Promise.all(files.map((file) => head.read(file)));
      const pages = new Map<string, string>();
      for (const [i, file] of files.entries()) {
        const text = texts[i];
        if (text !== undefined) pages.set(file, text);
      }
      const seeds = selectorSources(pages, [...selectors]);
      if ("reason" in seeds) return { all: seeds.reason };
      return {
        seeds: seeds.files,
        note: `${selectors.size} changed selectors, rendered by ${seeds.files.length} sources`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { all: `couldn't diff the compiled CSS: ${message}` };
    }
  },
};
