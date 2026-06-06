import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import CodeSnippetInlineInModal from "./CodeSnippetInlineInModal.test.svelte";
import CodeSnippetPortalTooltipTimeout from "./CodeSnippetPortalTooltipTimeout.test.svelte";

describe("CodeSnippet portal tooltip", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  afterEach(() => {
    const existingPortals = document.querySelectorAll("[data-floating-portal]");
    for (const portal of existingPortals) {
      portal.remove();
    }
  });

  describe("inline variant", () => {
    it("should use portal when inside Modal (portalTooltip not passed)", async () => {
      render(CodeSnippetInlineInModal, {
        props: { modalOpen: true },
      });

      const button = screen.getByRole("button", { name: "Copy code" });
      expect(button).toHaveClass("bx--copy-btn--portal-active");

      await user.click(button);
      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
      expect(
        portal?.querySelector(".bx--tooltip-portal__content"),
      ).toHaveTextContent("Copied!");
    });

    it("should not use portal when inside Modal with portalTooltip=false", () => {
      render(CodeSnippetInlineInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      const button = screen.getByRole("button", { name: "Copy code" });
      expect(button).not.toHaveClass("bx--copy-btn--portal-active");
      expect(
        button.querySelector(".bx--copy-btn__feedback"),
      ).toBeInTheDocument();
    });

    describe("feedback timeout", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      // Regression: portalled feedback hides the inline element, so the
      // hide-feedback animation (and animationend) never runs; feedbackTimeout
      // must close the portal directly or the tooltip stays open.
      it("should dismiss portal feedback after feedbackTimeout", async () => {
        render(CodeSnippetPortalTooltipTimeout);

        const button = screen.getByRole("button", { name: "Copy code" });
        await fireEvent.click(button);
        await Promise.resolve();

        expect(
          document.querySelector("[data-floating-portal]"),
        ).toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(100);

        expect(
          document.querySelector("[data-floating-portal]"),
        ).not.toBeInTheDocument();

        await fireEvent.click(button);
        await Promise.resolve();
        expect(
          document.querySelector("[data-floating-portal]"),
        ).toBeInTheDocument();
      });
    });

    // Regression: observer must re-attach when portalTooltip flips after mount.
    it("should dismiss portal feedback when modal closes after portalTooltip toggled on", async () => {
      const { rerender } = render(CodeSnippetInlineInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      rerender({ modalOpen: true, portalTooltip: true });

      const button = screen.getByRole("button", { name: "Copy code" });
      await user.click(button);
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toBeInTheDocument();

      rerender({ modalOpen: false, portalTooltip: true });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });
  });
});
