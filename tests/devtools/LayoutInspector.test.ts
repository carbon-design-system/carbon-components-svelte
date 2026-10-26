import { render } from "@testing-library/svelte";
import LayoutInspector from "./LayoutInspector.test.svelte";

function root(container: HTMLElement) {
  return container.querySelector(".bx--layout-inspector");
}

describe("LayoutInspector", () => {
  it("renders nothing until open", () => {
    const { container } = render(LayoutInspector);
    expect(root(container)).toBeNull();
  });

  it("renders a hidden, left-to-right dev tool layer when open", () => {
    const { container } = render(LayoutInspector, {
      props: { open: true, class: "custom", "data-testid": "inspector" },
    });
    const el = root(container);
    expect(el).toHaveClass("bx--layout-inspector", "custom");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("dir", "ltr");
    expect(el).toHaveAttribute("data-ccs-dev-tool");
    expect(el).toHaveAttribute("data-testid", "inspector");
  });

  it("shows no summary without a check", () => {
    const { container } = render(LayoutInspector, { props: { open: true } });
    expect(
      container.querySelector(".bx--layout-inspector__summary"),
    ).toBeNull();
    expect(container.querySelector(".bx--layout-inspector__page")).toBeNull();
  });

  it("counts each check that is on", () => {
    const { container } = render(LayoutInspector, {
      props: {
        open: true,
        checkSpacing: true,
        checkContrast: true,
        checkTargets: true,
        checkOverflow: true,
      },
    });
    const summary = container.querySelector(".bx--layout-inspector__summary");
    expect(summary).toHaveTextContent(
      "0 off-scale 0 small targets 0 low contrast 0 overflowing",
    );
  });

  it("names only the checks that are on", () => {
    const { container } = render(LayoutInspector, {
      props: { open: true, checkTargets: true },
    });
    const summary = container.querySelector(".bx--layout-inspector__summary");
    expect(summary).toHaveTextContent("0 small targets");
    expect(summary).not.toHaveTextContent("off-scale");
  });

  it("stops scanning when closed", async () => {
    const { container, rerender } = render(LayoutInspector, {
      props: { open: true, checkSpacing: true },
    });
    await rerender({ open: false });
    expect(root(container)).toBeNull();
  });
});
