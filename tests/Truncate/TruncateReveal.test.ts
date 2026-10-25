import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { activeTooltip } from "../../src/utils/tooltip-group.js";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import TruncateReveal from "./TruncateReveal.test.svelte";

type Size = {
  scrollWidth?: number;
  clientWidth?: number;
  scrollHeight?: number;
  clientHeight?: number;
};

const CLIPPED: Size = { scrollWidth: 400, clientWidth: 200 };
const FITS: Size = { scrollWidth: 200, clientWidth: 200 };

// jsdom has no layout, so stub the sizes `isTruncated` reads.
function setSize(element: HTMLElement, size: Size) {
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
}

// Stub the sizes before the observer's first callback, then let Svelte
// apply the result.
async function renderReveal(
  props: Record<string, unknown> = {},
  size: Size = CLIPPED,
) {
  const result = render(TruncateReveal, { props });
  const text = screen.getByTestId("text");
  setSize(text, size);
  await Promise.resolve();
  await tick();
  return { ...result, text };
}

describe("Truncate reveal", () => {
  afterEach(() => {
    activeTooltip.set(null);
  });

  it("only clips when reveal is none", async () => {
    const { text } = await renderReveal({ reveal: "none" });

    expect(text).toHaveClass("bx--text-truncate--end");
    expect(text).not.toHaveAttribute("tabindex");
    expect(text).not.toHaveAttribute("id");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await fireEvent.focus(text);
    await tick();
    expect(openTooltips()).toHaveLength(0);
  });

  describe("tooltip", () => {
    it("makes clipped text focusable and shows the full text on focus", async () => {
      const { text } = await renderReveal();

      expect(text).toHaveAttribute("tabindex", "0");
      expect(text).toHaveClass("bx--text-truncate--focusable");

      await user.tab();
      expect(text).toHaveFocus();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent(
        "Failed to deploy revision 214: the payments-api image exceeded the memory limit.",
      );

      await user.tab();
      expect(openTooltips()).toHaveLength(0);
    });

    it("keeps text that fits out of the tab order", async () => {
      const { text } = await renderReveal({}, FITS);

      expect(text).not.toHaveAttribute("tabindex");
      expect(text).not.toHaveClass("bx--text-truncate--focusable");

      await fireEvent.focus(text);
      await tick();
      expect(openTooltips()).toHaveLength(0);
    });

    it("hides on Escape and keeps the key from ancestors", async () => {
      const { text } = await renderReveal();

      text.focus();
      await tick();
      expect(openTooltips()).toHaveLength(1);

      await user.keyboard("{Escape}");
      expect(openTooltips()).toHaveLength(0);
      expect(text).toHaveFocus();
      expect(screen.getByTestId("escapes")).toHaveTextContent("0");

      // With the tooltip gone, the next Escape reaches the ancestor.
      await user.keyboard("{Escape}");
      expect(screen.getByTestId("escapes")).toHaveTextContent("1");
    });

    it("follows the text when it changes", async () => {
      const { text, rerender } = await renderReveal();

      setSize(text, FITS);
      await rerender({ text: "Deployed revision 215." });
      await tick();
      expect(text).not.toHaveAttribute("tabindex");

      setSize(text, CLIPPED);
      await rerender({
        text: "Rolled back revision 215: the payments-api health check failed in us-south.",
      });
      await tick();
      expect(text).toHaveAttribute("tabindex", "0");

      text.focus();
      await tick();
      expect(openTooltips()[0]).toHaveTextContent(
        "Rolled back revision 215: the payments-api health check failed in us-south.",
      );
    });

    it("measures the block axis for multiline text", async () => {
      const { text } = await renderReveal(
        { lines: 3 },
        {
          scrollWidth: 200,
          clientWidth: 200,
          scrollHeight: 96,
          clientHeight: 48,
        },
      );

      expect(text).toHaveClass("bx--text-truncate--multiline");
      expect(text).toHaveAttribute("tabindex", "0");
    });
  });

  describe("expand", () => {
    it("adds a toggle that controls the text", async () => {
      const { text } = await renderReveal({ reveal: "expand" });
      const toggle = screen.getByRole("button", { name: "View more" });

      expect(text.id).toMatch(/^ccs-truncate-/);
      expect(toggle).toHaveAttribute("aria-controls", text.id);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(text).not.toHaveAttribute("tabindex");

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveTextContent("View less");
      expect(toggle).toHaveFocus();
      expect(screen.getByTestId("expanded")).toHaveTextContent("true");
      expect(text).not.toHaveClass("bx--text-truncate--end");

      await user.keyboard("{Enter}");

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveTextContent("View more");
      expect(text).toHaveClass("bx--text-truncate--end");
    });

    it("keeps a front clamp's text node while expanded", async () => {
      const { text } = await renderReveal({ reveal: "expand", clamp: "front" });
      const isolate = text.querySelector("bdi");
      expect(isolate).not.toBeNull();

      await user.click(screen.getByRole("button", { name: "View more" }));

      expect(text).not.toHaveClass("bx--text-truncate--front");
      expect(text.querySelector("bdi")).toBe(isolate);
    });

    it("unclamps multiline text", async () => {
      const { text } = await renderReveal(
        { reveal: "expand", lines: 3, expanded: true },
        { scrollHeight: 96, clientHeight: 96 },
      );

      expect(text).not.toHaveClass("bx--text-truncate--multiline");
      expect(screen.getByRole("button", { name: "View less" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("uses a consumer id and custom labels", async () => {
      const { text } = await renderReveal({
        reveal: "expand",
        id: "incident-summary",
        labels: { expandLabel: "Read more", collapseLabel: "Read less" },
      });
      const toggle = screen.getByRole("button", { name: "Read more" });

      expect(text).toHaveAttribute("id", "incident-summary");
      expect(toggle).toHaveAttribute("aria-controls", "incident-summary");

      await user.click(toggle);
      expect(toggle).toHaveTextContent("Read less");
    });

    it("renders no toggle when the text fits", async () => {
      await renderReveal({ reveal: "expand" }, FITS);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
