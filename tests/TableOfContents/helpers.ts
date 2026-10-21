import { render } from "@testing-library/svelte";
import TableOfContents from "./TableOfContents.test.svelte";

/** Renders the TOC with "overview" selected and every row stubbed to `height`; returns the height spy. */
export function renderMeasured(height: number) {
  const offsetHeight = vi
    .spyOn(HTMLElement.prototype, "offsetHeight", "get")
    .mockReturnValue(height);
  const result = render(TableOfContents, {
    selectedId: "overview",
    noScrollSpy: true,
  });
  return { ...result, offsetHeight };
}
