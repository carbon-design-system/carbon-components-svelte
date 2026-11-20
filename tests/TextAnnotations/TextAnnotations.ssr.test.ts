// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TextAnnotations from "./TextAnnotations.test.svelte";

const TEXT = "Payment is due sixty days after delivery.";

describe("TextAnnotations server render", () => {
  it("renders the document and the rail with no browser", () => {
    const { document } = renderSSR(TextAnnotations, {
      annotations: [
        {
          id: "a",
          range: { start: 15, end: 25 },
          quote: "sixty days",
          comments: [
            { id: "c", author: { name: "Grace Hopper" }, body: "Too long?" },
          ],
        },
      ],
    });
    const region = document.querySelector('[role="region"]');
    expect(region?.getAttribute("aria-label")).toBe("Service agreement");
    expect(region?.textContent).toContain("Payment is due");
    // Nothing is wrapped or positioned until the client attaches.
    expect(document.querySelector("mark")).toBeNull();
    expect(
      document.querySelector(".bx--text-annotations--positioned"),
    ).toBeNull();
    expect(
      document.querySelector("[data-annotation-button]")?.textContent,
    ).toContain("Comment by Grace Hopper");
  });

  it("renders plain text as written", () => {
    const { document } = renderSSR(TextAnnotations, { text: TEXT });
    expect(
      document.querySelector(".bx--text-annotations__document--text")
        ?.textContent,
    ).toBe(TEXT);
  });
});
