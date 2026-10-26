import { render } from "@testing-library/svelte";
import GridOverlay from "./GridOverlay.test.svelte";

describe("GridOverlay", () => {
  it("should render nothing by default", () => {
    const { container } = render(GridOverlay);
    const overlay = container.querySelector(".bx--grid-overlay");
    expect(overlay).toBeNull();
  });

  it("should render the overlay with 16 columns when open", () => {
    const { container } = render(GridOverlay, {
      props: { open: true },
    });
    const overlay = container.querySelector(".bx--grid-overlay");
    expect(overlay).not.toBeNull();

    const cols = container.querySelectorAll(".bx--grid-overlay__col");
    expect(cols.length).toBe(16);
  });

  it("should render condensed variant", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, condensed: true },
    });
    const grid = container.querySelector(".bx--grid-overlay__grid");
    expect(grid).toHaveClass("bx--grid--condensed");
  });

  it("should render fullWidth variant", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, fullWidth: true },
    });
    expect(container.querySelector(".bx--grid-overlay__grid")).toHaveClass(
      "bx--grid--full-width",
    );
  });

  it("should shade gutters only when gutters is set", async () => {
    const { container, rerender } = render(GridOverlay, {
      props: { open: true },
    });
    expect(container.querySelector(".bx--grid-overlay")).not.toHaveClass(
      "bx--grid-overlay--gutters",
    );

    await rerender({ gutters: true, narrow: true, class: "custom" });
    const overlay = container.querySelector(".bx--grid-overlay");
    expect(overlay).toHaveClass("bx--grid-overlay--gutters");
    expect(container.querySelector(".bx--grid-overlay__grid")).toHaveClass(
      "bx--grid--narrow",
    );
    expect(overlay).toHaveClass("custom");
  });

  it("should show exactly 4 columns and hide the rest at the sm breakpoint", () => {
    const { container } = render(GridOverlay, {
      props: { open: true },
    });
    const shown = container.querySelectorAll(".bx--col-sm-1");
    const hidden = container.querySelectorAll(".bx--col-sm-0");
    expect(shown.length).toBe(4);
    expect(hidden.length).toBe(12);
  });

  it("should show exactly 8 columns and hide the rest at the md breakpoint", () => {
    const { container } = render(GridOverlay, {
      props: { open: true },
    });
    expect(container.querySelectorAll(".bx--col-md-1").length).toBe(8);
    expect(container.querySelectorAll(".bx--col-md-0").length).toBe(8);
  });
});

describe("GridOverlay options", () => {
  it("marks the overlay as a hidden dev tool", () => {
    const { container } = render(GridOverlay, { props: { open: true } });
    const overlay = container.querySelector(".bx--grid-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveAttribute("data-ccs-dev-tool");
  });

  it("hides the columns", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, columns: false, baseline: 8 },
    });
    expect(container.querySelector(".bx--grid-overlay__grid")).toBeNull();
    expect(
      container.querySelector(".bx--grid-overlay__baseline"),
    ).not.toBeNull();
  });

  it("hatches the margins", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, margins: true },
    });
    expect(container.querySelector(".bx--grid-overlay")).toHaveClass(
      "bx--grid-overlay--margins",
    );
    expect(container.querySelectorAll(".bx--grid-overlay__margin").length).toBe(
      2,
    );
  });

  it("numbers the columns", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, numbers: true },
    });
    const numbers = container.querySelectorAll(".bx--grid-overlay__number");
    expect(numbers.length).toBe(16);
    expect(numbers[0]).toHaveTextContent("1");
    expect(numbers[15]).toHaveTextContent("16");
  });

  it("draws baseline rows at the step and emphasis", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, baseline: 8, baselineEmphasis: 4 },
    });
    const rows = container.querySelector<HTMLElement>(
      ".bx--grid-overlay__baseline",
    );
    expect(
      rows?.style.getPropertyValue("--ccs-grid-overlay-baseline-step"),
    ).toBe("8px");
    expect(
      rows?.style.getPropertyValue("--ccs-grid-overlay-baseline-major"),
    ).toBe("32px");
  });

  it("draws every row the same with no emphasis", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, baseline: 4, baselineEmphasis: 0 },
    });
    const rows = container.querySelector<HTMLElement>(
      ".bx--grid-overlay__baseline",
    );
    expect(
      rows?.style.getPropertyValue("--ccs-grid-overlay-baseline-major"),
    ).toBe("4px");
  });

  it("draws no rows at 0", () => {
    const { container } = render(GridOverlay, { props: { open: true } });
    expect(container.querySelector(".bx--grid-overlay__baseline")).toBeNull();
  });

  it("adds a left-to-right layer for text baselines", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, textBaselines: true },
    });
    expect(container.querySelector(".bx--grid-overlay__text")).toHaveAttribute(
      "dir",
      "ltr",
    );
  });

  it("labels the viewport and the row step", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, label: true, baseline: 8 },
    });
    const label = container.querySelector(".bx--grid-overlay__label");
    expect(label).toHaveAttribute("dir", "ltr");
    expect(label).toHaveTextContent(`${window.innerWidth}px`);
    expect(label).toHaveTextContent("8px rows");
  });
});
