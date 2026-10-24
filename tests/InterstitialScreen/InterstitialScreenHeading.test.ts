import { render, screen } from "@testing-library/svelte";
import InterstitialScreenHeading from "./InterstitialScreenHeading.test.svelte";

describe("InterstitialScreenHeader", () => {
  it.each([
    { isFullScreen: true, inSection: false, headingLevel: undefined, level: 1 },
    { isFullScreen: true, inSection: true, headingLevel: undefined, level: 2 },
    {
      isFullScreen: false,
      inSection: false,
      headingLevel: undefined,
      level: 2,
    },
    { isFullScreen: false, inSection: true, headingLevel: undefined, level: 2 },
    { isFullScreen: true, inSection: false, headingLevel: 3, level: 3 },
    { isFullScreen: false, inSection: false, headingLevel: 3, level: 3 },
  ] as const)(
    "renders the title at level $level (isFullScreen=$isFullScreen, inSection=$inSection, headingLevel=$headingLevel)",
    (props) => {
      render(InterstitialScreenHeading, { props });

      const heading = screen.getByRole("heading", {
        name: "Set up your workspace",
      });
      expect(heading.tagName).toBe(`H${props.level}`);
      expect(heading).toHaveClass("bx--interstitial-screen__title");
      // The subtitle is text under the title, not a heading of its own.
      expect(
        screen.queryByRole("heading", {
          name: "This takes about two minutes.",
        }),
      ).not.toBeInTheDocument();
    },
  );

  it.each([true, false])(
    "marks a titled header and leaves an untitled one plain (isFullScreen=%s)",
    async (isFullScreen) => {
      const { container, rerender } = render(InterstitialScreenHeading, {
        props: { isFullScreen },
      });
      const header = () =>
        (isFullScreen ? container : document.body).querySelector(
          ".bx--interstitial-screen__header",
        );

      expect(header()).toHaveClass(
        "bx--interstitial-screen__header--has-title",
      );

      await rerender({ title: "", subTitle: "" });
      expect(header()).not.toHaveClass(
        "bx--interstitial-screen__header--has-title",
      );
    },
  );
});
