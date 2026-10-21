import { render, screen, within } from "@testing-library/svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import BreadcrumbProps from "./Breadcrumb.props.test.svelte";
import BreadcrumbSeparatorDynamic from "./Breadcrumb.separator.dynamic.test.svelte";
import BreadcrumbSeparatorIcon from "./Breadcrumb.separator.icon.test.svelte";
import Breadcrumb from "./Breadcrumb.test.svelte";

describe("Breadcrumb separator", () => {
  it("defaults to a slash, unchanged from today's behavior", () => {
    render(Breadcrumb);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("'/'");
  });

  it("reflects a custom separator as the quoted custom property", () => {
    render(BreadcrumbProps, { props: { separator: "→" } });

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("'→'");
  });

  it.each([
    ["\\", "'\\\\'"],
    ["'", "'\\''"],
  ])("escapes %j in the quoted custom property", (separator, expected) => {
    render(BreadcrumbProps, { props: { separator } });

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe(expected);
  });

  it("renders a component separator as a decorative DOM node, suppressing the CSS pseudo-element", () => {
    render(BreadcrumbSeparatorIcon);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("bx--breadcrumb--separator-icon");
    expect(list.style.getPropertyValue("--ccs-separator")).toBe("''");

    const separators = document.querySelectorAll(
      ".bx--breadcrumb-item__separator",
    );
    expect(separators).toHaveLength(2);

    for (const separator of separators) {
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("swaps between a text and a component separator after mount", async () => {
    const { rerender } = render(BreadcrumbSeparatorDynamic);
    const separators = () =>
      document.querySelectorAll(".bx--breadcrumb-item__separator");
    expect(separators()).toHaveLength(0);

    await rerender({ separator: Add });
    expect(separators()).toHaveLength(2);

    await rerender({ separator: "→" });
    expect(separators()).toHaveLength(0);
  });

  it("marks the skeleton for a component separator", () => {
    render(BreadcrumbProps, {
      props: { separator: Add, withSkeleton: true },
    });

    expect(document.querySelector(".bx--skeleton.bx--breadcrumb")).toHaveClass(
      "bx--breadcrumb--separator-icon",
    );
  });
});
