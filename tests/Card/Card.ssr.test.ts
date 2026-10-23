// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Card from "./Card.ssr.test.svelte";

describe("Card (server)", () => {
  it("renders the link, its icon and the decorator beside it", () => {
    const { document } = renderSSR(Card);

    const link = document.querySelector("a.bx--card");
    expect(link?.getAttribute("href")).toBe("/reports");
    expect(link?.parentElement?.classList).toContain("bx--card__wrapper");
    expect(link?.querySelector(".bx--card__clickable-footer svg")).not.toBe(
      null,
    );
    expect(link?.querySelector(".bx--card__decorator")).toBeNull();
    expect(
      document.querySelector(".bx--card__wrapper > .bx--card__decorator"),
    ).not.toBeNull();
  });

  it.each([
    [false, "bx--aspect-ratio"],
    [true, "bx--card__media--horizontal"],
  ])("renders media for horizontal=%s", (horizontal, className) => {
    const { document } = renderSSR(Card, { horizontal });

    const media = document.querySelector(".bx--card__media");
    expect(media?.classList).toContain(className);
    expect(media?.querySelector("img")).not.toBeNull();
  });

  // The media renders before the decorator, so the server already knows
  // its shape, and the label doesn't jump off the media on hydration.
  it.each([
    [false, "start", "--ccs-card-media-block: 0.5"],
    [true, "start", null],
    [true, "end", "--ccs-card-media-inline: 40%"],
  ] as const)(
    "places the decorator clear of the media for horizontal=%s, mediaPosition=%s",
    (horizontal, mediaPosition, style) => {
      const { document } = renderSSR(Card, { horizontal, mediaPosition });

      expect(
        document.querySelector(".bx--card__decorator")?.getAttribute("style") ??
          null,
      ).toBe(style);
    },
  );

  // The title leaves room for the actions from the first paint.
  it("marks a header with actions", () => {
    const { document } = renderSSR(Card);

    const header = document.querySelector(
      "[data-testid=actions] .bx--card__header",
    );
    expect(header?.classList).toContain("bx--card__header--actions");
    expect(header?.lastElementChild?.classList).toContain("bx--card__actions");
  });
});
