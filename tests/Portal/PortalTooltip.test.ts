import { render, screen } from "@testing-library/svelte";
import { nextFrame } from "../utils/next-frame";
import { rect } from "../utils/rect";
import PortalTooltipTest from "./PortalTooltip.test.svelte";
import { stubLayout } from "./helpers";

describe("PortalTooltip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Anchor at the viewport top: a "top" tooltip has no room and flips below.
  async function openFlipped() {
    const { rerender } = render(PortalTooltipTest, {
      props: { direction: "top" },
    });
    const layout = stubLayout({
      anchor: rect({ top: 5, bottom: 45, width: 100 }),
      floating: rect({ height: 30 }),
    });
    await rerender({ open: true });
    const tooltip = (await screen.findByText("Tooltip text")).closest(
      ".bx--tooltip-portal",
    );
    await nextFrame();
    return { layout, tooltip };
  }

  it("reports the flipped side in data-direction", async () => {
    const { tooltip } = await openFlipped();

    expect(tooltip).toHaveAttribute("data-direction", "bottom");
  });

  it("keeps the flipped side when the preferred side fits again", async () => {
    const { layout, tooltip } = await openFlipped();

    layout.anchor = rect({ top: 300, bottom: 340, width: 100 });
    window.dispatchEvent(new Event("scroll"));
    await nextFrame();

    expect(tooltip).toHaveAttribute("data-direction", "bottom");
  });

  describe("sliding into the window", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("dir");
    });

    // A 16px anchor at `left` and a 240px tooltip in a 1000px window.
    async function openAt(left: number, direction: "top" | "right" = "top") {
      vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
        1000,
      );
      const { rerender } = render(PortalTooltipTest, {
        props: { direction },
      });
      stubLayout({
        anchor: rect({ top: 300, left, width: 16, height: 16 }),
        floating: rect({ top: 0, width: 240, height: 40 }),
      });
      await rerender({ open: true });
      const body = (
        await screen.findByText("Tooltip text")
      ).closest<HTMLElement>(".bx--tooltip-portal__content");
      await nextFrame();
      await nextFrame();
      return body;
    }

    it("slides the body back inside, leaving the caret on the anchor", async () => {
      // Centered on the anchor at 970, the box spans 850 to 1090, and its
      // far edge has to come back to 992.
      const body = await openAt(962);
      await vi.waitFor(() => expect(body?.style.left).toBe("-98px"));
      expect(body?.style.position).toBe("relative");
    });

    it("leaves a body that fits, and one beside the anchor", async () => {
      expect((await openAt(400))?.style.left).toBe("");
    });

    it("leaves a body beside the anchor in place", async () => {
      expect((await openAt(962, "right"))?.style.left).toBe("");
    });
  });
});
