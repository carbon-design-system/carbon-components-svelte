import { render, screen } from "@testing-library/svelte";
import { nextFrame } from "../utils/next-frame";
import { rect } from "../utils/rect";
import { stubLayout } from "./helpers";
import PortalTooltipTest from "./PortalTooltip.test.svelte";

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
});
