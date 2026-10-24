import { render, screen, waitFor } from "@testing-library/svelte";
import ProgressIndicatorSkeleton from "carbon-components-svelte/ProgressIndicator/ProgressIndicatorSkeleton.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { makeSteps } from "./helpers";
import ProgressIndicator from "./ProgressIndicator.test.svelte";
import ProgressIndicatorConditional from "./ProgressIndicatorConditional.test.svelte";
import ProgressIndicatorReactive from "./ProgressIndicatorReactive.test.svelte";
import ProgressIndicatorSelectedId from "./ProgressIndicatorSelectedId.test.svelte";
import ProgressStepIconSlot from "./ProgressStepIconSlot.test.svelte";
import ProgressStepStandalone from "./ProgressStepStandalone.test.svelte";

describe("ProgressIndicator", () => {
  describe("Default (horizontal)", () => {
    it("should expose current, complete, and invalid state to assistive tech", async () => {
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: makeSteps([true, false, false], { 2: { invalid: true } }),
      });
      await tick();

      const buttons = screen.getAllByRole("button");

      expect(buttons[0]).not.toHaveAttribute("aria-current");
      expect(buttons[1]).toHaveAttribute("aria-current", "step");
      expect(buttons[2]).not.toHaveAttribute("aria-current");

      expect(buttons[0]).toHaveAccessibleName(/, complete$/);
      expect(buttons[2]).toHaveAccessibleName(/, invalid$/);
    });

    it("should dispatch change with the index when clicking on completed steps", async () => {
      const onchange = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 2,
        steps: makeSteps([true, true, true, false]),
        onchange,
      });

      await user.click(screen.getByText("Step 1"));
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: 0 }),
      );
    });

    it.each([
      [
        "a complete step when preventChangeOnClick is true",
        {
          currentIndex: 2,
          preventChangeOnClick: true,
          steps: makeSteps([true, true, true, false]),
        },
        "Step 1",
      ],
      [
        "an incomplete step",
        { currentIndex: 0, steps: makeSteps([true, false, false, false]) },
        "Step 4",
      ],
    ])(
      "should not dispatch change when clicking %s",
      async (_, props, label) => {
        const onchange = vi.fn();
        render(ProgressIndicator, { ...props, onchange });

        await user.click(screen.getByText(label));
        expect(onchange).not.toHaveBeenCalled();
      },
    );
  });

  describe("Invalid and disabled states", () => {
    it("should render an invalid step as incomplete with the warning icon", () => {
      render(ProgressIndicator, {
        steps: makeSteps([true, false, false], {
          1: { invalid: true, disabled: false },
        }),
      });

      const invalidStep = screen.getAllByRole("listitem")[1];
      expect(invalidStep).toHaveClass("bx--progress-step--incomplete");
      expect(
        invalidStep.querySelector(".bx--progress__warning"),
      ).not.toBeNull();
      expect(
        screen
          .getAllByRole("listitem")[2]
          .querySelector(".bx--progress__warning"),
      ).toBeNull();
    });

    it("should render disabled steps", () => {
      render(ProgressIndicator, {
        steps: makeSteps([true, false, false], {
          1: { invalid: false, disabled: true },
          2: { invalid: false, disabled: true },
        }),
      });

      const disabledSteps = screen.getAllByRole("listitem").slice(1);
      for (const step of disabledSteps) {
        expect(step).toHaveClass("bx--progress-step--disabled");
      }
    });
  });

  // The fixture's `steps` defaults to `[]`, so both accept the same props.
  describe.each<[string, typeof ProgressIndicator]>([
    ["ProgressIndicator", ProgressIndicator],
    [
      "ProgressIndicatorSkeleton",
      ProgressIndicatorSkeleton as unknown as typeof ProgressIndicator,
    ],
  ])("%s variants", (_, Component) => {
    it.each([
      [{}, { spaceEqual: false, vertical: false }],
      [{ spaceEqually: true }, { spaceEqual: true, vertical: false }],
      [{ vertical: true }, { spaceEqual: false, vertical: true }],
      [
        { vertical: true, spaceEqually: true },
        { spaceEqual: false, vertical: true },
      ],
    ])("props %j -> classes %j", (props, expected) => {
      render(Component, { props });

      const list = screen.getByRole("list");
      expect(list.classList.contains("bx--progress--space-equal")).toBe(
        expected.spaceEqual,
      );
      expect(list.classList.contains("bx--progress--vertical")).toBe(
        expected.vertical,
      );
    });
  });

  describe("Accessibility", () => {
    it("should have correct button attributes for different states", async () => {
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: makeSteps([true, false, false]),
      });
      await tick();

      const buttons = screen.getAllByRole("button");

      expect(buttons[0]).toHaveAttribute("tabindex", "0");
      expect(buttons[0]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[0]).not.toHaveClass(
        "bx--progress-step-button--unclickable",
      );

      expect(buttons[1]).toHaveAttribute("tabindex", "0");
      expect(buttons[1]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[1]).toHaveClass("bx--progress-step-button--unclickable");

      expect(buttons[2]).toHaveAttribute("tabindex", "0");
      expect(buttons[2]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[2]).toHaveClass("bx--progress-step-button--unclickable");
    });

    it("should have correct button attributes for disabled state", () => {
      render(ProgressIndicator, {
        steps: makeSteps([true, false], { 1: { disabled: true } }),
      });

      const disabledButton = screen.getAllByRole("button")[1];
      expect(disabledButton).toHaveAttribute("disabled");
      expect(disabledButton).toHaveAttribute("aria-disabled", "true");
      expect(disabledButton).toHaveAttribute("tabindex", "-1");
    });

    // <button> cannot contain block-level <p>.
    it("renders the label and secondary label as spans, not paragraphs", () => {
      const { container } = render(ProgressStepStandalone);

      const label = container.querySelector(".bx--progress-label");
      const secondary = container.querySelector(".bx--progress-optional");
      assert(label);
      assert(secondary);
      expect(label.tagName).toBe("SPAN");
      expect(secondary.tagName).toBe("SPAN");
    });

    it("should forward focus and blur events from step button", () => {
      const onfocus = vi.fn();
      const onblur = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: makeSteps([true, false]),
        onfocus,
        onblur,
      });

      const completeStepButton = screen.getAllByRole("button")[0];
      completeStepButton.focus();
      expect(onfocus).toHaveBeenCalledWith("Step 1");

      completeStepButton.blur();
      expect(onblur).toHaveBeenCalledWith("Step 1");
    });

    it("should dispatch change exactly once per keypress on a complete step", async () => {
      const onchange = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 2,
        steps: makeSteps([true, true, false]),
        onchange,
      });

      const completeStepButton = screen.getAllByRole("button")[0];
      await user.tab();
      expect(completeStepButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onchange).toHaveBeenCalledTimes(1);
      expect(onchange).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: 0 }),
      );

      await user.keyboard("{ArrowRight}");
      await user.keyboard(" ");
      expect(onchange).toHaveBeenCalledTimes(2);
    });

    it("does not dispatch change for the current step", async () => {
      const onchange = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: makeSteps([true, true]),
        onchange,
      });

      const buttons = screen.getAllByRole("button");
      await user.click(buttons[1]);
      expect(onchange).not.toHaveBeenCalled();

      await user.click(buttons[0]);
      expect(onchange).toHaveBeenCalledTimes(1);
    });

    it("moves the current step to the clicked step", async () => {
      render(ProgressIndicator, {
        currentIndex: 2,
        steps: makeSteps([true, true, true, false]),
      });

      const buttons = screen.getAllByRole("button");
      const items = screen.getAllByRole("listitem");
      expect(buttons[2]).toHaveAttribute("aria-current", "step");

      await user.click(buttons[0]);

      expect(buttons[0]).toHaveAttribute("aria-current", "step");
      expect(buttons[2]).not.toHaveAttribute("aria-current");
      expect(items[0]).toHaveClass("bx--progress-step--current");
      expect(items[2]).not.toHaveClass("bx--progress-step--current");
    });

    it("moves the current step when currentIndex changes", async () => {
      const { rerender } = render(ProgressIndicator, {
        currentIndex: 0,
        steps: makeSteps([true, true, false]),
      });

      await rerender({ currentIndex: 2 });

      const items = screen.getAllByRole("listitem");
      expect(items[2]).toHaveClass("bx--progress-step--current");
      expect(items[0]).not.toHaveClass("bx--progress-step--current");
      expect(screen.getAllByRole("button")[2]).toHaveAttribute(
        "aria-current",
        "step",
      );
    });

    it("toggles the unclickable class when preventChangeOnClick changes", async () => {
      const { rerender } = render(ProgressIndicator, {
        currentIndex: 1,
        steps: makeSteps([true, true, false]),
      });

      const button = screen.getAllByRole("button")[0];
      expect(button).not.toHaveClass("bx--progress-step-button--unclickable");

      await rerender({ preventChangeOnClick: true });
      expect(button).toHaveClass("bx--progress-step-button--unclickable");

      await rerender({ preventChangeOnClick: false });
      expect(button).not.toHaveClass("bx--progress-step-button--unclickable");
    });
  });

  describe("Keyboard navigation", () => {
    const fourSteps = makeSteps([true, false, false, false], {
      3: { disabled: true },
    });

    it("moves focus with ArrowLeft/ArrowRight, skips the disabled step, wraps at the ends, and never dispatches change", async () => {
      const onchange = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: fourSteps,
        onchange,
      });

      const buttons = screen.getAllByRole("button");

      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(buttons[1]).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(buttons[0]).toHaveFocus();

      await user.keyboard("{End}");
      expect(buttons[2]).toHaveFocus();

      await user.keyboard("{Home}");
      expect(buttons[0]).toHaveFocus();

      await user.keyboard("{End}");
      expect(buttons[2]).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(buttons[0]).toHaveFocus();

      expect(onchange).not.toHaveBeenCalled();
    });

    it("swaps ArrowLeft and ArrowRight in RTL", async () => {
      document.documentElement.style.direction = "rtl";
      render(ProgressIndicator, { currentIndex: 1, steps: fourSteps });
      const buttons = screen.getAllByRole("button");

      try {
        await user.tab();
        await user.keyboard("{ArrowLeft}");
        expect(buttons[1]).toHaveFocus();

        await user.keyboard("{ArrowRight}{ArrowRight}");
        expect(buttons[2]).toHaveFocus();
      } finally {
        document.documentElement.style.removeProperty("direction");
      }
    });

    it("prevents the default action of an unmodified ArrowRight", async () => {
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: fourSteps,
      });

      const buttons = screen.getAllByRole("button");
      buttons[0].focus();

      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      });
      buttons[0].dispatchEvent(event);
      await tick();

      expect(event.defaultPrevented).toBe(true);
      expect(buttons[1]).toHaveFocus();
    });

    it.each(["altKey", "ctrlKey", "metaKey"])(
      "leaves ArrowRight with %s held to the browser",
      async (modifier) => {
        render(ProgressIndicator, {
          currentIndex: 1,
          steps: fourSteps,
        });

        const buttons = screen.getAllByRole("button");
        buttons[0].focus();

        const event = new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
          [modifier]: true,
        });
        buttons[0].dispatchEvent(event);
        await tick();

        expect(event.defaultPrevented).toBe(false);
        expect(buttons[0]).toHaveFocus();
      },
    );

    it("moves focus with ArrowUp/ArrowDown when vertical, ignoring horizontal arrows", async () => {
      render(ProgressIndicator, {
        currentIndex: 1,
        vertical: true,
        steps: fourSteps,
      });

      const buttons = screen.getAllByRole("button");

      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(buttons[1]).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(buttons[1]).toHaveFocus();
    });
  });

  describe("Conditional step rendering", () => {
    it("should remove unmounted steps and re-index, so change emits the correct index", async () => {
      const onchange = vi.fn();
      const { rerender } = render(ProgressIndicatorConditional, {
        showOptional: true,
        currentIndex: 0,
        onchange,
      });

      expect(screen.getAllByRole("listitem")).toHaveLength(3);

      await rerender({ showOptional: false, currentIndex: 0, onchange });

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      });

      // The remaining "Step 3" must now report index 1, not 2.
      await user.click(screen.getByText("Step 3"));
      expect(onchange).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: 1 }),
      );
    });

    it.each([
      [
        "a step is inserted mid-list",
        ["Step 1", "Step 3"],
        ["Step 1", "Step 2", "Step 3"],
      ],
      [
        "keyed steps are reordered",
        ["Step 1", "Step 2", "Step 3"],
        ["Step 3", "Step 2", "Step 1"],
      ],
    ])("indexes steps by DOM position after %s", async (_, before, after) => {
      const onchange = vi.fn();
      const toSteps = (labels: string[]) =>
        labels.map((label) => ({ label, description: "", complete: true }));
      const { rerender } = render(ProgressIndicator, {
        currentIndex: 1,
        steps: toSteps(before),
        onchange,
      });
      await tick();

      await rerender({ currentIndex: 1, steps: toSteps(after), onchange });
      await tick();

      expect(screen.getAllByRole("listitem")[1]).toHaveClass(
        "bx--progress-step--current",
      );
      await user.click(screen.getAllByRole("button")[2]);
      expect(onchange).toHaveBeenLastCalledWith(
        expect.objectContaining({ detail: 2 }),
      );
    });

    it("does not track the logical step across removal when selectedId is unset (documents existing index-based behavior)", async () => {
      const { rerender } = render(ProgressIndicatorConditional, {
        showOptional: true,
        currentIndex: 2,
      });
      await tick();

      let listItems = screen.getAllByRole("listitem");
      expect(listItems[2]).toHaveTextContent("Step 3");
      expect(listItems[2]).toHaveClass("bx--progress-step--current");

      await rerender({ showOptional: false, currentIndex: 2 });

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      });

      listItems = screen.getAllByRole("listitem");
      // Step 3 shifted from index 2 to index 1, but currentIndex is still 2
      // (no selectedId to re-anchor it) — by design, no step is marked
      // "current" anymore. This is the pre-existing, unchanged behavior;
      // selectedId is the opt-in fix for it.
      expect(listItems[1]).toHaveTextContent("Step 3");
      expect(listItems[1]).not.toHaveClass("bx--progress-step--current");
      expect(
        listItems.some((item) =>
          item.classList.contains("bx--progress-step--current"),
        ),
      ).toBe(false);
    });
  });

  describe("Icon slot", () => {
    it("should render custom icon slot content with state props", async () => {
      render(ProgressStepIconSlot);
      await tick();

      const icon1 = screen.getByTestId("icon-1");
      expect(icon1).toHaveTextContent("c:true|cur:false|inv:false");

      const icon2 = screen.getByTestId("icon-2");
      expect(icon2).toHaveTextContent("c:false|cur:true|inv:false");

      const icon3 = screen.getByTestId("icon-3");
      expect(icon3).toHaveTextContent("c:false|cur:false|inv:true");

      // Default icons should not render when the slot is overridden.
      expect(document.querySelector(".bx--progress__warning")).toBeNull();
    });
  });

  describe("Reactive complete prop", () => {
    it("should update the complete class when the prop changes", async () => {
      const { rerender } = render(ProgressIndicatorReactive, {
        props: {
          step1Complete: false,
          step2Complete: false,
        },
      });

      const listItems = screen.getAllByRole("listitem");

      expect(listItems[0]).not.toHaveClass("bx--progress-step--complete");
      expect(listItems[1]).not.toHaveClass("bx--progress-step--complete");

      await rerender({ step1Complete: true, step2Complete: false });
      expect(listItems[0]).toHaveClass("bx--progress-step--complete");
      expect(listItems[1]).not.toHaveClass("bx--progress-step--complete");

      await rerender({ step1Complete: true, step2Complete: true });
      expect(listItems[1]).toHaveClass("bx--progress-step--complete");

      await rerender({ step1Complete: false, step2Complete: true });
      expect(listItems[0]).not.toHaveClass("bx--progress-step--complete");
      expect(listItems[1]).toHaveClass("bx--progress-step--complete");
    });
  });

  describe("selectedId", () => {
    it("keeps selectedId on the same logical step when a prior step is removed", async () => {
      render(ProgressIndicatorSelectedId, {
        props: { selectedId: "step-b", showStepA: true },
      });
      await tick();

      let listItems = screen.getAllByRole("listitem");
      expect(listItems[1]).toHaveTextContent("Step B");
      expect(listItems[1]).toHaveClass("bx--progress-step--current");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("step-b");
      expect(screen.getByTestId("current-index")).toHaveTextContent("1");

      await user.click(screen.getByTestId("toggle-step-a"));

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      });

      listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveTextContent("Step B");
      expect(listItems[0]).toHaveClass("bx--progress-step--current");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("step-b");
      expect(screen.getByTestId("current-index")).toHaveTextContent("0");
    });

    it("falls back when the selectedId step itself is removed", async () => {
      render(ProgressIndicatorSelectedId, {
        props: { selectedId: "step-a", showStepA: true },
      });

      await user.click(screen.getByTestId("toggle-step-a"));

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      });

      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveTextContent("Step B");
      expect(listItems[0]).toHaveClass("bx--progress-step--current");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("step-b");
      expect(screen.getByTestId("current-index")).toHaveTextContent("0");
    });

    it("uses the index API when selectedId is unset", async () => {
      render(ProgressIndicatorSelectedId, {
        props: { currentIndex: 2, selectedId: undefined },
      });
      await tick();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems[2]).toHaveClass("bx--progress-step--current");
      expect(screen.getByTestId("current-index")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("");
    });

    it("updates the bound selectedId when a step is clicked", async () => {
      render(ProgressIndicatorSelectedId, {
        props: { selectedId: "step-b" },
      });

      await user.click(screen.getAllByRole("button")[0]);

      expect(screen.getByTestId("selected-id")).toHaveTextContent("step-a");
      expect(screen.getByTestId("current-index")).toHaveTextContent("0");
    });

    it("lets selectedId win over currentIndex", async () => {
      render(ProgressIndicatorSelectedId, {
        props: { currentIndex: 0, selectedId: "step-c" },
      });
      await tick();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems[2]).toHaveClass("bx--progress-step--current");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("step-c");
      expect(screen.getByTestId("current-index")).toHaveTextContent("2");
    });
  });
});
