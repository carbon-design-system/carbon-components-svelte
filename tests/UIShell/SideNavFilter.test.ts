import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SideNavFilterTest from "./SideNavFilter.test.svelte";

describe("SideNavFilter", () => {
  it("hides non-matching links and keeps matching ones visible", async () => {
    render(SideNavFilterTest);

    await user.type(
      screen.getByRole("searchbox", { name: "Filter" }),
      "dashboard",
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Resource list" }),
    ).not.toBeInTheDocument();
  });

  it("force-expands a collapsed SideNavMenu containing a match and hides it when no child matches", async () => {
    render(SideNavFilterTest);

    const getMenuButton = () =>
      screen.getByRole("button", { name: "Kubernetes" });

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");

    await user.type(
      screen.getByRole("searchbox", { name: "Filter" }),
      "clusters",
    );

    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Clusters" })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Worker pools" }),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: "Filter" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Filter" }),
      "no such nav item",
    );

    expect(screen.queryByRole("button", { name: "Kubernetes" })).toBeNull();
  });

  it("restores the original expand state when the filter is cleared", async () => {
    render(SideNavFilterTest);

    const input = screen.getByRole("searchbox", { name: "Filter" });
    await user.type(input, "clusters");
    expect(screen.getByRole("button", { name: "Kubernetes" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.clear(input);

    expect(screen.getByRole("button", { name: "Kubernetes" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Resource list" })).toBeVisible();
  });

  it("shows the empty state when nothing matches", async () => {
    render(SideNavFilterTest);

    await user.type(
      screen.getByRole("searchbox", { name: "Filter" }),
      "no such nav item",
    );

    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("does not show the empty state before typing or once a match exists", async () => {
    render(SideNavFilterTest);

    expect(screen.queryByText("No results found")).not.toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Filter" }),
      "dashboard",
    );

    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("moves focus with the arrow keys only across currently-visible links", async () => {
    render(SideNavFilterTest);

    const input = screen.getByRole("searchbox", { name: "Filter" });
    await user.type(input, "clusters");

    input.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Clusters" })).toHaveFocus();

    // Only one visible link remains; ArrowDown wraps back to it rather than
    // landing on a hidden link.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: "Clusters" })).toHaveFocus();
  });

  it("does not render the filter input when the rail is collapsed", () => {
    // Query the raw DOM rather than by role: `SideNav` marks its `<nav>`
    // `aria-hidden` whenever `isOpen` is false (rail or not), which would
    // also hide an always-rendered filter from role queries and mask a
    // regression here.
    const { container } = render(SideNavFilterTest, {
      props: { rail: true, isSideNavOpen: false },
    });

    expect(container.querySelector(".bx--side-nav-filter")).toBeNull();
  });

  it("renders the filter input for a non-collapsed rail", () => {
    const { container } = render(SideNavFilterTest, {
      props: { rail: true, isSideNavOpen: true },
    });

    expect(container.querySelector(".bx--side-nav-filter")).not.toBeNull();
  });
});
