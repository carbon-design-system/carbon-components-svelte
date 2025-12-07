import { render, screen, within } from "@testing-library/svelte";
import ProgressBarSlot from "./ProgressBar.slot.test.svelte";
import ProgressBar from "./ProgressBar.test.svelte";

describe("ProgressBar", () => {
  it("should render indeterminate if status is active", () => {
    render(ProgressBar);

    const progressBar = screen.getByTestId("indeterminate-progress");
    expect(progressBar.closest("div")).toHaveClass(
      "bx--progress-bar--indeterminate",
    );
    expect(progressBar).not.toHaveAttribute("aria-valuenow");
    expect(progressBar).not.toHaveAttribute("aria-valuemin");
    expect(progressBar).not.toHaveAttribute("aria-valuemax");
  });

  it("should render with helper text", () => {
    render(ProgressBar);

    const helperText = screen.getByText("Loading...");
    expect(helperText).toHaveClass("bx--progress-bar__helper-text");
  });

  it("should render with specified value and max", () => {
    render(ProgressBar);

    const progressBar = within(screen.getByTestId("progress-40%")).getByRole(
      "progressbar",
    );
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("should render different sizes", () => {
    render(ProgressBar);

    const smallBar = screen.getByTestId("small-progress");
    const mediumBar = screen.getByTestId("medium-progress");

    expect(smallBar).toHaveClass("bx--progress-bar--small");
    expect(mediumBar).toHaveClass("bx--progress-bar--big");
  });

  it("should render different kinds", () => {
    render(ProgressBar);

    const inlineBar = screen.getByTestId("inline-progress");
    const indentedBar = screen.getByTestId("indented-progress");

    expect(inlineBar).toHaveClass("bx--progress-bar--inline");
    expect(indentedBar).toHaveClass("bx--progress-bar--indented");
  });

  it("should handle different statuses", () => {
    render(ProgressBar);

    const errorBar = screen.getByTestId("error-progress");
    const finishedBar = screen.getByTestId("finished-progress");

    expect(errorBar).toHaveClass("bx--progress-bar--error");
    expect(finishedBar).toHaveClass("bx--progress-bar--finished");
  });

  it("should handle hidden label", () => {
    render(ProgressBar);

    const label = screen.getByText("Hidden label");
    expect(label).toHaveClass("bx--visually-hidden");
  });

  it("should cap values appropriately", () => {
    render(ProgressBar);

    const overMax = within(screen.getByTestId("over-max")).getByRole(
      "progressbar",
    );
    expect(overMax).toHaveAttribute("aria-valuenow", "100");

    const underZero = within(screen.getByTestId("under-zero")).getByRole(
      "progressbar",
    );
    expect(underZero).toHaveAttribute("aria-valuenow", "0");
  });

  it("supports custom label slot", () => {
    render(ProgressBarSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });
});
