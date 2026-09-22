import { render, screen, within } from "@testing-library/svelte";
import ProgressBarSlot from "./ProgressBar.slot.test.svelte";
import ProgressBar from "./ProgressBar.test.svelte";
import ProgressBarStatus from "./ProgressBarStatus.test.svelte";

function getLiveRegion(container: HTMLElement) {
  const region = container.querySelector('[aria-live="polite"]');
  if (region === null) throw new Error("live region not found");
  return region;
}

function getDescriptions(container: HTMLElement, progressBar: HTMLElement) {
  return (progressBar.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => {
      const description = container.querySelector(`#${id}`);
      if (description === null) throw new Error(`description ${id} not found`);
      return description;
    });
}

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

  it("reports the actual value when errored and the maximum when finished", () => {
    render(ProgressBar);

    const errorBar = within(screen.getByTestId("error-progress")).getByRole(
      "progressbar",
    );
    expect(errorBar).toHaveAttribute("aria-valuenow", "40");

    const finishedBar = within(
      screen.getByTestId("finished-progress"),
    ).getByRole("progressbar");
    expect(finishedBar).toHaveAttribute("aria-valuenow", "100");

    const partiallyFinishedBar = within(
      screen.getByTestId("finished-partial"),
    ).getByRole("progressbar");
    expect(partiallyFinishedBar).toHaveAttribute("aria-valuenow", "100");

    const finishedWithoutValue = within(
      screen.getByTestId("finished-without-value"),
    ).getByRole("progressbar");
    expect(finishedWithoutValue).toHaveAttribute("aria-valuenow", "100");

    const zeroMaxError = within(screen.getByTestId("error-zero-max")).getByRole(
      "progressbar",
    );
    expect(zeroMaxError).toHaveAttribute("aria-valuemin", "0");
    expect(zeroMaxError).toHaveAttribute("aria-valuemax", "0");
    expect(zeroMaxError).toHaveAttribute("aria-valuenow", "0");
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

  it("should not scale the bar by NaN when max is 0", () => {
    render(ProgressBar);

    const zeroMaxBar = screen
      .getByTestId("zero-max")
      .querySelector(".bx--progress-bar__bar");
    if (zeroMaxBar === null) throw new Error("bar not found");
    expect(zeroMaxBar).toHaveStyle("transform: scaleX(0)");
    expect(zeroMaxBar.getAttribute("style")).not.toContain("NaN");

    const fortyPercentBar = screen
      .getByTestId("progress-40%")
      .querySelector(".bx--progress-bar__bar");
    if (fortyPercentBar === null) throw new Error("bar not found");
    expect(fortyPercentBar).toHaveStyle("transform: scaleX(0.4)");

    const indeterminateBar = screen
      .getByTestId("indeterminate-progress")
      .querySelector(".bx--progress-bar__bar");
    if (indeterminateBar === null) throw new Error("bar not found");
    expect(indeterminateBar).toHaveStyle("transform: scaleX(0)");
    expect(indeterminateBar.getAttribute("style")).not.toContain("NaN");
  });

  it("associates the label with the progressbar via aria-labelledby", () => {
    render(ProgressBar);

    const progressBar = within(screen.getByTestId("progress-40%")).getByRole(
      "progressbar",
    );
    const label = screen.getByText("Progress 40%");
    expect(progressBar).toHaveAttribute("aria-labelledby", label.id);
    expect(label).toHaveClass("bx--progress-bar__label-text");
    expect(label.parentElement).toHaveClass("bx--progress-bar__label");
    expect(progressBar).not.toHaveAttribute("for");
  });

  it("supports custom label slot", () => {
    render(ProgressBarSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("uses valueText for aria-valuetext and shows it in the label row", () => {
    render(ProgressBar);

    const el = screen.getByTestId("value-text");
    const progressBar = within(el).getByRole("progressbar", {
      name: "Upload",
    });
    expect(progressBar).toHaveAttribute("aria-valuetext", "40 MB of 100 MB");
    expect(progressBar).toHaveAttribute("aria-valuenow", "40");
    expect(el).toHaveTextContent("40 MB of 100 MB");
  });

  it("uses explicit valueText for an error status", () => {
    render(ProgressBar);

    const progressBar = within(
      screen.getByTestId("value-text-error"),
    ).getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Failed at 40 MB");
  });

  it("omits aria-valuetext and the value-text node when valueText is unset", () => {
    render(ProgressBar);

    const progressBar = within(screen.getByTestId("no-value-text")).getByRole(
      "progressbar",
    );
    expect(progressBar).not.toHaveAttribute("aria-valuetext");
    expect(
      screen
        .getByTestId("no-value-text")
        .querySelector(".bx--progress-bar__value-text"),
    ).toBeNull();
  });

  it("keeps value text visible when the label is visually hidden", () => {
    render(ProgressBar);

    const el = screen.getByTestId("hidden-label-value-text");
    const progressBar = within(el).getByRole("progressbar", {
      name: "Hidden upload label",
    });
    const label = within(el).getByText("Hidden upload label");
    const displayedValue = within(el).getByText("40 MB of 100 MB");

    expect(label).toHaveClass("bx--visually-hidden");
    expect(displayedValue).not.toHaveClass("bx--visually-hidden");
    expect(progressBar).toHaveAttribute("aria-valuetext", "40 MB of 100 MB");
  });

  it("renders valueChildren while using valueText as its accessible equivalent", () => {
    render(ProgressBar);

    const el = screen.getByTestId("value-children");
    const progressBar = within(el).getByRole("progressbar", {
      name: "Rich upload value",
    });

    expect(within(el).getByText("40 MB / 100 MB")).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuetext", "40 MB of 100 MB");
  });

  it("does not render a value-text node for whitespace-only valueText", () => {
    render(ProgressBar);

    const el = screen.getByTestId("whitespace-value-text");
    expect(el.querySelector(".bx--progress-bar__value-text")).toBeNull();
    expect(within(el).getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuetext",
    );
  });

  it("announces a status change but not value ticks or the first render", async () => {
    const { container, rerender } = render(ProgressBarStatus, {
      props: { status: "active", value: 40 },
    });

    const liveRegion = getLiveRegion(container);
    expect(liveRegion).toHaveTextContent("");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveClass("bx--visually-hidden");

    await rerender({ status: "error", value: 40 });
    expect(liveRegion).toHaveTextContent("Error");

    await rerender({ status: "active", value: 40 });
    expect(liveRegion).toHaveTextContent("");

    await rerender({ status: "finished", value: 40 });
    expect(liveRegion).toHaveTextContent("Complete");

    await rerender({ status: "active", value: 40 });
    await rerender({ status: "active", value: 50 });
    expect(liveRegion).toHaveTextContent("");
  });

  it("describes but does not announce a status the bar already mounted with", () => {
    const { container } = render(ProgressBarStatus, {
      props: { status: "error", value: 40 },
    });

    expect(getLiveRegion(container)).toHaveTextContent("");
    const progressBar = within(container).getByRole("progressbar");
    const descriptions = getDescriptions(container, progressBar);
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toHaveTextContent("Error");
    expect(descriptions[0]).toHaveClass("bx--visually-hidden");
  });

  it("supports localized status text alongside helper text", async () => {
    const { container, rerender } = render(ProgressBarStatus, {
      props: {
        status: "active",
        value: 40,
        helperText: "Uploading",
        errorText: "Échec",
        finishedText: "Terminé",
      },
    });

    await rerender({
      status: "error",
      value: 40,
      helperText: "Uploading",
      errorText: "Échec",
      finishedText: "Terminé",
    });

    const progressBar = within(container).getByRole("progressbar");
    const descriptions = getDescriptions(container, progressBar);
    expect(descriptions).toHaveLength(2);
    expect(descriptions.map((description) => description.textContent)).toEqual([
      "Uploading",
      "Échec",
    ]);
    expect(getLiveRegion(container)).toHaveTextContent("Échec");
  });
});
