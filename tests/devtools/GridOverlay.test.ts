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
    const overlay = container.querySelector(".bx--grid-overlay");
    expect(overlay).toHaveClass("bx--grid--condensed");
  });

  it("should render fullWidth variant", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, fullWidth: true },
    });
    expect(container.querySelector(".bx--grid-overlay")).toHaveClass(
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
    expect(overlay).toHaveClass("bx--grid--narrow");
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
