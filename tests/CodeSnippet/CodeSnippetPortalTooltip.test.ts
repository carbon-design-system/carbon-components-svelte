import { fireEvent, render, screen } from "@testing-library/svelte";
import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
import { COPY_FEEDBACK_FADE_MS } from "../../src/constants/timing.js";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import CodeSnippetInlineInModal from "./CodeSnippetInlineInModal.test.svelte";
import { mockClipboard, removeFloatingPortals } from "./helpers";

describe("CodeSnippet portal tooltip", () => {
  beforeEach(() => {
    mockClipboard();
  });

  afterEach(removeFloatingPortals);

  describe("inline variant", () => {
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

      // The portalled tooltip fades out, then the timeout fallback removes it
      // if `animationend` never fires, or the tooltip would stay open.
      it("should dismiss portal feedback after feedbackTimeout", async () => {
        render(CodeSnippet, {
          props: {
            type: "inline",
            code: "npm install",
            copyLabel: "Copy code",
            portalTooltip: true,
            feedbackTimeout: 100,
          },
        });

        const button = screen.getByRole("button", { name: "Copy code" });
        await fireEvent.click(button);
        await Promise.resolve();

        expect(
          document.querySelector("[data-floating-portal]"),
        ).toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(100);

        expect(document.querySelector(".bx--tooltip-portal")).toHaveClass(
          "bx--tooltip-portal--fade-out",
        );

        await vi.advanceTimersByTimeAsync(COPY_FEEDBACK_FADE_MS + 50);

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

      await rerender({ modalOpen: true, portalTooltip: true });

      const button = screen.getByRole("button", { name: "Copy code" });
      await user.click(button);
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toBeInTheDocument();

      await rerender({ modalOpen: false, portalTooltip: true });
      await flushMacrotask();

      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });
  });
});
