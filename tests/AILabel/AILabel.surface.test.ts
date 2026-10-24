import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import AILabelSurface from "./AILabel.surface.test.svelte";
import { surfaceHosts } from "./helpers";

function surface(testId: string, selector: string) {
  const element = screen.getByTestId(testId).querySelector(selector);
  assert(element);
  return element;
}

describe("AI surface on the client", () => {
  it("renders the AI surface in the first render, as on the server", async () => {
    const added: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target;
        if (!(target instanceof Element)) continue;
        const before = record.oldValue ?? "";
        for (const [, , name] of surfaceHosts) {
          if (target.classList.contains(name) && !before.includes(name)) {
            added.push(name);
          }
        }
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
      attributeOldValue: true,
      subtree: true,
    });

    render(AILabelSurface);
    await tick();
    observer.disconnect();

    for (const [testId, selector, name] of surfaceHosts) {
      expect.soft(surface(testId, selector), testId).toHaveClass(name);
    }
    expect(added).toEqual([]);
  });

  it("clears the AI surface for a decorator that is not an AI label", async () => {
    render(AILabelSurface, { ai: false });
    await tick();

    for (const [testId, selector, name] of surfaceHosts) {
      expect.soft(surface(testId, selector), testId).not.toHaveClass(name);
    }
    expect(screen.getAllByTestId("icon")).toHaveLength(surfaceHosts.length);
  });

  it("adds and drops the AI surface with the label", async () => {
    const { rerender } = render(AILabelSurface, { ai: false });
    const tile = surface("tile", ".bx--tile");

    await rerender({ ai: true });
    expect(tile).toHaveClass("bx--tile--ai-label");

    await rerender({ ai: false });
    expect(tile).not.toHaveClass("bx--tile--ai-label");
  });
});
