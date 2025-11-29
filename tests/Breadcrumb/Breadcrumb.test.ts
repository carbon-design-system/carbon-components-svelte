import { render, screen, within } from "@testing-library/svelte";
import BreadcrumbDynamic from "./Breadcrumb.dynamic.test.svelte";
import BreadcrumbNoTrailingSlash from "./Breadcrumb.noTrailingSlash.test.svelte";
import BreadcrumbSkeleton from "./Breadcrumb.skeleton.test.svelte";
import Breadcrumb from "./Breadcrumb.test.svelte";

describe("Breadcrumb", () => {
  it("renders with default props", () => {
    render(Breadcrumb);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();

    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("bx--breadcrumb");
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
  });

  it("renders with noTrailingSlash", () => {
    render(BreadcrumbNoTrailingSlash);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const list = within(nav).getByRole("list");
    expect(list).toHaveClass("bx--breadcrumb--no-trailing-slash");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Home");
    expect(links[0]).toHaveAttribute("href", "/");

    expect(links[1]).toHaveTextContent("Profile");
    expect(links[1]).toHaveAttribute("href", "/profile");
    expect(items[1]).toHaveClass("bx--breadcrumb-item--current");
  });

  it("renders skeleton state", () => {
    render(BreadcrumbSkeleton);

    const skeletons = document.querySelectorAll(".bx--skeleton.bx--breadcrumb");
    expect(skeletons).toHaveLength(2);

    const firstSkeleton = skeletons[0];
    expect(firstSkeleton).not.toHaveClass("bx--breadcrumb--no-trailing-slash");

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

  it("renders with dynamic items", () => {
    render(BreadcrumbDynamic);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("Dashboard");
    expect(links[0]).toHaveAttribute("href", "/");

    expect(links[1]).toHaveTextContent("Annual reports");
    expect(links[1]).toHaveAttribute("href", "/reports");

    expect(links[2]).toHaveTextContent("2019");
    expect(links[2]).toHaveAttribute("href", "/reports/2019");
    expect(items[2]).toHaveClass("bx--breadcrumb-item--current");
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
});
