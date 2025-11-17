import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ProgressIndicator from "./ProgressIndicator.test.svelte";

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
      const { component } = render(ProgressIndicator, {
        currentIndex: 2,
        preventChangeOnClick: true,
        steps: [
          { label: "Step 1", description: "First step", complete: true },
          { label: "Step 2", description: "Second step", complete: true },
          { label: "Step 3", description: "Third step", complete: true },
          { label: "Step 4", description: "Fourth step", complete: false },
        ],
      });

      const changeHandler = vi.fn();
      component.$on("change", changeHandler);

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
  });
});
