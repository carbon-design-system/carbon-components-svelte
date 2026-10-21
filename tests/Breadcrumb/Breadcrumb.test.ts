import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import BreadcrumbAriaCurrent from "./Breadcrumb.ariaCurrent.test.svelte";
import BreadcrumbDynamic from "./Breadcrumb.dynamic.test.svelte";
import BreadcrumbOrientationToggle from "./Breadcrumb.orientation-toggle.test.svelte";
import BreadcrumbProps from "./Breadcrumb.props.test.svelte";
import BreadcrumbSkeleton from "./Breadcrumb.skeleton.test.svelte";
import BreadcrumbSlotProps from "./Breadcrumb.slotProps.test.svelte";
import Breadcrumb from "./Breadcrumb.test.svelte";

describe("Breadcrumb", () => {
  it("renders with default props", () => {
    render(Breadcrumb);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();

    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("bx--breadcrumb");
    expect(list).not.toHaveClass("bx--breadcrumb--sm");
    expect(list).not.toHaveClass("bx--breadcrumb--no-trailing-slash");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[0]).toHaveAttribute("href", "/");

    expect(links[1]).toHaveTextContent("Annual reports");
    expect(links[1]).toHaveAttribute("href", "/reports");

    expect(links[2]).toHaveTextContent("2019");
    expect(links[2]).toHaveAttribute("href", "/reports/2019");
    expect(items[2]).toHaveClass("bx--breadcrumb-item--current");
    expect(links[2]).toHaveAttribute("aria-current", "page");
  });

  it("supports custom labelText", () => {
    render(BreadcrumbProps, { props: { labelText: "Page navigation" } });

    const nav = screen.getByRole("navigation", { name: "Page navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("renders skeleton state", () => {
    render(BreadcrumbSkeleton);

    const skeletons = document.querySelectorAll(".bx--skeleton.bx--breadcrumb");
    expect(skeletons).toHaveLength(2);

    const firstSkeleton = skeletons[0];
    expect(firstSkeleton).not.toHaveClass("bx--breadcrumb--no-trailing-slash");
    expect(firstSkeleton).toHaveAttribute("aria-hidden", "true");

    const firstSkeletonItems = firstSkeleton.querySelectorAll(
      ".bx--breadcrumb-item",
    );
    expect(firstSkeletonItems).toHaveLength(3);

    const secondSkeleton = skeletons[1];
    expect(secondSkeleton).toHaveClass("bx--breadcrumb--no-trailing-slash");

    const secondSkeletonItems = secondSkeleton.querySelectorAll(
      ".bx--breadcrumb-item",
    );
    expect(secondSkeletonItems).toHaveLength(5);
  });

  it("applies current class and forwards aria-current to the link, not the <li>", () => {
    render(BreadcrumbAriaCurrent);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    const links = screen.getAllByRole("link");

    // `aria-current="step"` is forwarded as given and does not mark current.
    expect(links[0]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveClass("bx--breadcrumb-item--current");

    // `aria-current="page"` alone marks the item current.
    expect(links[1]).toHaveAttribute("aria-current", "page");
    expect(items[1]).toHaveClass("bx--breadcrumb-item--current");

    expect(links[2]).toHaveAttribute("aria-current", "page");
    expect(items[2]).toHaveClass("bx--breadcrumb-item--current");

    for (const item of items) {
      expect(item).not.toHaveAttribute("aria-current");
    }
  });

  it("spreads link class and aria-current onto a custom link", () => {
    render(BreadcrumbSlotProps);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveClass("bx--link");
    expect(links[0]).not.toHaveAttribute("aria-current");
    expect(links[1]).toHaveClass("bx--link");
    expect(links[1]).toHaveAttribute("aria-current", "page");
  });

  it("updates when dynamic items change", async () => {
    const { rerender } = render(BreadcrumbDynamic);

    let items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    await rerender({
      items: [
        { href: "/", text: "Home" },
        { href: "/settings", text: "Settings" },
      ],
    });

    items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Home");
    expect(links[0]).toHaveAttribute("href", "/");

    expect(links[1]).toHaveTextContent("Settings");
    expect(links[1]).toHaveAttribute("href", "/settings");

    expect(items[1]).toHaveClass("bx--breadcrumb-item--current");
  });

  it.each([
    [{ size: "sm" }, "bx--breadcrumb--sm", []],
    [{ noTrailingSlash: true }, "bx--breadcrumb--no-trailing-slash", []],
    [
      { orientation: "horizontal" },
      "bx--breadcrumb--horizontal",
      ["bx--breadcrumb--vertical"],
    ],
    [
      { orientation: "vertical" },
      "bx--breadcrumb--vertical",
      ["bx--breadcrumb--horizontal"],
    ],
  ])("applies %j to the list and the skeleton", (props, className, absent) => {
    render(BreadcrumbProps, { props: { ...props, withSkeleton: true } });

    const list = within(screen.getByRole("navigation")).getByRole("list");
    expect(list).toHaveClass(className);

    const skeleton = document.querySelector(".bx--skeleton.bx--breadcrumb");
    expect(skeleton).toHaveClass(className);
    for (const other of absent) expect(skeleton).not.toHaveClass(other);
  });

  it("updates the orientation class when orientation changes", async () => {
    render(BreadcrumbOrientationToggle);
    const list = within(screen.getByRole("navigation")).getByRole("list");
    const next = screen.getByRole("button", { name: "Next orientation" });

    expect(list).not.toHaveClass("bx--breadcrumb--horizontal");
    expect(list).not.toHaveClass("bx--breadcrumb--vertical");

    await user.click(next);
    expect(list).toHaveClass("bx--breadcrumb--horizontal");
    expect(list).not.toHaveClass("bx--breadcrumb--vertical");

    await user.click(next);
    expect(list).toHaveClass("bx--breadcrumb--vertical");
    expect(list).not.toHaveClass("bx--breadcrumb--horizontal");
  });
});
