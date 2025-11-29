import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Link from "./Link.test.svelte";

describe("Link", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default props", () => {
    render(Link);
    // Find the first link (default link) which doesn't have special classes
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find(
      (l) =>
        !l.classList.contains("bx--link--inline") &&
        !l.classList.contains("bx--link--disabled") &&
        !l.classList.contains("bx--link--visited") &&
        !l.classList.contains("bx--link--lg") &&
        !l.classList.contains("bx--link--sm") &&
        l.getAttribute("target") !== "_blank",
    );
    assert(link);

    expect(link).toHaveClass("bx--link");
    expect(link).toHaveAttribute("href", "https://www.carbondesignsystem.com/");
    expect(link).toHaveTextContent("Carbon Design System");
  });

  it("adds noopener noreferrer when target is _blank", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.getAttribute("target") === "_blank");
    assert(link);

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("supports inline variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--inline"));
    assert(link);

    expect(link).toHaveClass("bx--link--inline");
  });

  it("supports icon prop", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.querySelector(".bx--link__icon"));
    assert(link);

    const iconWrapper = link.querySelector(".bx--link__icon");
    assert(iconWrapper);
    expect(iconWrapper.querySelector("svg")).toBeInTheDocument();
  });

  it("supports icon slot", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    // Find the second link with icon (first is from icon prop, second is from slot)
    const linksWithIcons = links.filter((l) =>
      l.querySelector(".bx--link__icon"),
    );
    const link = linksWithIcons[1];
    assert(link);

    const iconWrapper = link.querySelector(".bx--link__icon");
    assert(iconWrapper);
    expect(iconWrapper.querySelector("svg")).toBeInTheDocument();
  });

  it("supports large size variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--lg"));
    assert(link);

    expect(link).toHaveClass("bx--link--lg");
  });

  it("supports small size variant", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--sm"));
    assert(link);

    expect(link).toHaveClass("bx--link--sm");
  });

  it("supports disabled state", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.getAttribute("aria-disabled") === "true");
    assert(link);

    expect(link).toHaveClass("bx--link--disabled");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("role", "link");
  });

  it("supports visited state", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--visited"));
    assert(link);

    expect(link).toHaveClass("bx--link--visited");
  });

  it("supports click and mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Link);

    // Find the first link (default link) which has the click handler
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links[0];
    assert(link);

    await user.click(link);
    expect(consoleLog).toHaveBeenCalledWith("click");

    await user.hover(link);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.hover(link);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");

    await user.unhover(link);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    expect(consoleLog).toHaveBeenCalledTimes(4);
  });

  it("prevents icon rendering when inline is true", () => {
    render(Link);
    const links = screen.getAllByRole("link", { name: "Carbon Design System" });
    const link = links.find((l) => l.classList.contains("bx--link--inline"));
    assert(link);

    expect(link).toHaveClass("bx--link--inline");
    expect(link.querySelector(".bx--link__icon")).not.toBeInTheDocument();
  });
});
