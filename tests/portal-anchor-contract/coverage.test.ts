/// <reference types="vite/client" />
import { cases, exempt } from "./cases";

const sources = import.meta.glob<string>("../../src/**/*.svelte", {
  query: "?raw",
  import: "default",
  eager: true,
});

const name = (path: string) => path.replace(/^.*\/|\.svelte$/g, "");

// Renders a box placed against an anchor: a floating portal, a portalled
// tooltip or list box menu, or a Menu it hands an anchor to.
const ANCHORED =
  /<(FloatingPortal|PortalTooltip|AnchoredTooltip|ListBoxMenu)\b|<Menu\b[^>]*\banchor=/;

const candidates = Object.keys(sources)
  .filter((path) => ANCHORED.test(sources[path]))
  .map(name)
  .sort();

describe("portal anchor coverage", () => {
  const covered = new Set(cases.map((c) => c.name));

  it.each(candidates)("%s has a case or an exemption", (component) => {
    expect(covered.has(component) || component in exempt).toBe(true);
  });

  it("only exempts components that need it", () => {
    const stale = Object.keys(exempt).filter(
      (component) => !candidates.includes(component) || covered.has(component),
    );
    expect(stale).toEqual([]);
  });

  it("only has cases for components that place a portal", () => {
    expect([...covered].filter((c) => !candidates.includes(c))).toEqual([]);
  });
});
