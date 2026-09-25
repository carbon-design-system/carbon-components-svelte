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

  it("should shade gutters only when gutters is set", () => {
    const { container, unmount } = render(GridOverlay, {
      props: { open: true },
    });
    expect(container.querySelector(".bx--grid-overlay")).not.toHaveClass(
      "bx--grid-overlay--gutters",
    );
    unmount();

    const { container: withGutters } = render(GridOverlay, {
      props: { open: true, gutters: true, narrow: true, class: "custom" },
    });
    const overlay = withGutters.querySelector(".bx--grid-overlay");
    expect(overlay).toHaveClass("bx--grid-overlay--gutters");
    expect(overlay).toHaveClass("bx--grid--narrow");
    expect(overlay).toHaveClass("custom");
  });

  it("should keep a caller-supplied class alongside the overlay class", () => {
    const { container } = render(GridOverlay, {
      props: { open: true, class: "custom" },
    });
    const overlay = container.querySelector(".bx--grid-overlay");
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
});
