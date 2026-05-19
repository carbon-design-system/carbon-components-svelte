import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import ProgressIndicator from "./ProgressIndicator.test.svelte";
import ProgressIndicatorConditional from "./ProgressIndicatorConditional.test.svelte";
import ProgressIndicatorIssue1249 from "./ProgressIndicatorIssue1249.test.svelte";
import ProgressIndicatorReactive from "./ProgressIndicatorReactive.test.svelte";
import ProgressStepIconSlot from "./ProgressStepIconSlot.test.svelte";
import ProgressStepStandalone from "./ProgressStepStandalone.test.svelte";

describe("ProgressIndicator", () => {
  describe("Default (horizontal)", () => {
    it("should render steps with correct states", () => {
      render(ProgressIndicator, {
        currentIndex: 2,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: true },
          { label: "Step 3", description: "Third step", complete: true },
          { label: "Step 4", description: "Fourth step", complete: false },
        ],
      });

      const listItems = screen.getAllByRole("listitem");

      // Check if all steps are rendered
      expect(listItems).toHaveLength(4);

      // Check completed steps
      const completedSteps = listItems.filter((step) =>
        step.classList.contains("bx--progress-step--complete"),
      );
      expect(completedSteps).toHaveLength(3);

      // Check current step
      expect(listItems[2]).toHaveTextContent("Step 3");

      // Check incomplete step
      const incompleteStep = screen.getByText("Step 4");
      expect(incompleteStep).toBeInTheDocument();
      expect(incompleteStep.closest("li")).not.toHaveClass(
        "bx--progress-step--complete",
      );
    });

    it("should update currentIndex when clicking on completed steps", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ProgressIndicator, {
        currentIndex: 2,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: true },
          { label: "Step 3", description: "Third step", complete: true },
          { label: "Step 4", description: "Fourth step", complete: false },
        ],
      });

      expect(consoleLog).not.toHaveBeenCalled();

      // Click on a completed step
      await user.click(screen.getByText("Step 1"));
      expect(consoleLog).toHaveBeenCalledWith("change", 0);
    });

    it("should not update currentIndex when preventChangeOnClick is true", async () => {
      const changeHandler = vi.fn();
      render(ProgressIndicator, {
        props: {
          currentIndex: 2,
          preventChangeOnClick: true,
          steps: [
            { label: "Step 1", description: "First step", complete: true },
            { label: "Step 2", description: "Second step", complete: true },
            { label: "Step 3", description: "Third step", complete: true },
            { label: "Step 4", description: "Fourth step", complete: false },
          ],
          onchange: changeHandler,
        },
      });

      // Click on a completed step
      await user.click(screen.getByText("Step 1"));
      expect(changeHandler).not.toHaveBeenCalled();
    });
  });

  describe("Invalid and disabled states", () => {
    it("should render invalid step", () => {
      render(ProgressIndicator, {
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          {
            label: "Step 2",
            description: "Second step",
            complete: false,
            invalid: true,
            disabled: false,
          },
          { label: "Step 3", description: "Third step", complete: false },
        ],
      });

      const invalidStep = screen.getByText("Step 2").closest("li");
      expect(invalidStep).toHaveClass("bx--progress-step--incomplete");
    });

    it("should render disabled steps", () => {
      render(ProgressIndicator, {
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          {
            label: "Step 2",
            description: "Second step",
            complete: false,
            invalid: false,
            disabled: true,
          },
          {
            label: "Step 3",
            description: "Third step",
            complete: false,
            invalid: false,
            disabled: true,
          },
        ],
      });

      const disabledSteps = screen.getAllByRole("listitem").slice(1);
      for (const step of disabledSteps) {
        expect(step).toHaveClass("bx--progress-step--disabled");
      }
    });
  });

  describe("Variants", () => {
    it("should render vertical variant", () => {
      render(ProgressIndicator, {
        vertical: true,
        steps: [
          { label: "Step 1", description: "First step", complete: false },
          { label: "Step 2", description: "Second step", complete: false },
          { label: "Step 3", description: "Third step", complete: false },
        ],
      });

      const progressIndicator = screen.getByRole("list");
      expect(progressIndicator).toHaveClass("bx--progress--vertical");
    });

    it("should render with equal spacing", () => {
      render(ProgressIndicator, {
        spaceEqually: true,
        steps: [
          { label: "Step 1", description: "First step", complete: false },
          { label: "Step 2", description: "Second step", complete: false },
          { label: "Step 3", description: "Third step", complete: false },
        ],
      });

      const progressIndicator = screen.getByRole("list");
      expect(progressIndicator).toHaveClass("bx--progress--space-equal");
    });

    it("should not apply equal spacing in vertical variant", () => {
      render(ProgressIndicator, {
        vertical: true,
        spaceEqually: true,
        steps: [
          { label: "Step 1", description: "First step", complete: false },
          { label: "Step 2", description: "Second step", complete: false },
          { label: "Step 3", description: "Third step", complete: false },
        ],
      });

      const progressIndicator = screen.getByRole("list");
      expect(progressIndicator).not.toHaveClass("bx--progress--space-equal");
    });
  });

  describe("Accessibility", () => {
    it("should have correct button attributes for different states", () => {
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: false },
          { label: "Step 3", description: "Third step", complete: false },
        ],
      });

      const buttons = screen.getAllByRole("button");

      // Complete step button should be clickable
      expect(buttons[0]).toHaveAttribute("tabindex", "0");
      expect(buttons[0]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[0]).not.toHaveClass(
        "bx--progress-step-button--unclickable",
      );

      // Current step button should be unclickable
      expect(buttons[1]).toHaveAttribute("tabindex", "-1");
      expect(buttons[1]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[1]).toHaveClass("bx--progress-step-button--unclickable");

      // Incomplete step button should be unclickable
      expect(buttons[2]).toHaveAttribute("tabindex", "0");
      expect(buttons[2]).toHaveAttribute("aria-disabled", "false");
      expect(buttons[2]).not.toHaveClass(
        "bx--progress-step-button--unclickable",
      );
    });

    it("should have correct button attributes for disabled state", () => {
      render(ProgressIndicator, {
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          {
            label: "Step 2",
            description: "Second step",
            complete: false,
            disabled: true,
          },
        ],
      });

      const disabledButton = screen.getAllByRole("button")[1];
      expect(disabledButton).toHaveAttribute("disabled");
      expect(disabledButton).toHaveAttribute("aria-disabled", "true");
      expect(disabledButton).toHaveAttribute("tabindex", "-1");
    });

    it("should forward focus and blur events from step button", () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: false },
        ],
      });

      const completeStepButton = screen.getAllByRole("button")[0];
      completeStepButton.focus();
      expect(consoleLog).toHaveBeenCalledWith("focus", "Step 1");

      completeStepButton.blur();
      expect(consoleLog).toHaveBeenCalledWith("blur", "Step 1");
    });

    it("should support keyboard navigation for complete steps", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: false },
        ],
      });

      expect(consoleLog).not.toHaveBeenCalled();
      const completeStepButton = screen.getAllByRole("button")[0];
      await user.tab();
      expect(completeStepButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("change", 0);

      await user.keyboard(" ");
      expect(consoleLog).toHaveBeenCalledWith("change", 0);
    });

    it("should dispatch change exactly once per keypress on a complete step", async () => {
      const changeHandler = vi.fn();
      render(ProgressIndicator, {
        currentIndex: 1,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: false },
        ],
        onchange: changeHandler,
      });

      const completeStepButton = screen.getAllByRole("button")[0];
      await user.tab();
      expect(completeStepButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(changeHandler).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(changeHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Conditional step rendering", () => {
    it("should remove unmounted steps and re-index, so change emits the correct index", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(ProgressIndicatorConditional, {
        showOptional: true,
        currentIndex: 0,
      });

      expect(screen.getAllByRole("listitem")).toHaveLength(3);

      rerender({ showOptional: false, currentIndex: 0 });

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
      });

      // The remaining "Step 3" must now report index 1, not 2.
      await user.click(screen.getByText("Step 3"));
      expect(consoleLog).toHaveBeenLastCalledWith("change", 1);
    });
  });

  it("should not throw when ProgressStep is rendered outside a ProgressIndicator", () => {
    expect(() => render(ProgressStepStandalone)).not.toThrow();
    expect(screen.getByText("Standalone step")).toBeInTheDocument();
  });

  describe("Icon slot", () => {
    it("should render custom icon slot content with state props", () => {
      render(ProgressStepIconSlot);

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

  describe("Reactive complete prop (#1249)", () => {
    it("should update complete state immediately without delay", async () => {
      const { rerender } = render(ProgressIndicatorReactive, {
        props: {
          step1Complete: false,
          step2Complete: false,
        },
      });

      const listItems = screen.getAllByRole("listitem");

      expect(listItems[0]).not.toHaveClass("bx--progress-step--complete");
      expect(listItems[1]).not.toHaveClass("bx--progress-step--complete");

      rerender({ step1Complete: true, step2Complete: false });
      await waitFor(() => {
        expect(listItems[0]).toHaveClass("bx--progress-step--complete");
      });
      expect(listItems[1]).not.toHaveClass("bx--progress-step--complete");

      rerender({ step1Complete: true, step2Complete: true });
      await waitFor(() => {
        expect(listItems[1]).toHaveClass("bx--progress-step--complete");
      });

      rerender({ step1Complete: false, step2Complete: true });
      await waitFor(() => {
        expect(listItems[0]).not.toHaveClass("bx--progress-step--complete");
      });
      expect(listItems[1]).toHaveClass("bx--progress-step--complete");
    });

    it("should update step 3 on first button click (issue #1249 repro)", async () => {
      render(ProgressIndicatorIssue1249);

      const listItems = screen.getAllByRole("listitem");

      // After onMount, steps 1 and 2 should be complete.
      await waitFor(() => {
        expect(listItems[0]).toHaveClass("bx--progress-step--complete");
        expect(listItems[1]).toHaveClass("bx--progress-step--complete");
      });
      expect(listItems[2]).not.toHaveClass("bx--progress-step--complete");

      // Step 3 should become complete immediately.
      const button = screen.getByText("Click me twice");
      await user.click(button);

      // Before the fix, this would fail. Step 3 wouldn't update until second click.
      await waitFor(() => {
        expect(listItems[2]).toHaveClass("bx--progress-step--complete");
      });
    });
  });
});
