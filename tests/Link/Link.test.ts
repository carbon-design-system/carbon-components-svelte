import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Link from "./Link.test.svelte";

describe("Link", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default props", () => {
    render(Link);
    const wrapper = screen.getByTestId("default-link");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link");
    expect(link).toHaveAttribute("href", "https://www.carbondesignsystem.com/");
    expect(link).toHaveTextContent("Carbon Design System");
  });

  it("adds noopener noreferrer when target is _blank", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-blank");
    const link = wrapper.querySelector("a");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("supports inline variant", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-inline");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--inline");
  });

  it("supports icon prop", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-with-icon");
    const link = wrapper.querySelector("a");
    const iconWrapper = link?.querySelector(".bx--link__icon");

    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper?.querySelector("svg")).toBeInTheDocument();
  });

  it("supports icon slot", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-with-icon-slot");
    const link = wrapper.querySelector("a");
    const iconWrapper = link?.querySelector(".bx--link__icon");

    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper?.querySelector("svg")).toBeInTheDocument();
  });

  it("supports large size variant", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-large");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--lg");
  });

  it("supports small size variant", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-small");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--sm");
  });

  it("supports disabled state", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-disabled");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--disabled");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("role", "link");
  });

  it("supports visited state", () => {
    render(Link);
    const wrapper = screen.getByTestId("link-visited");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--visited");
  });

  it("supports click and mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Link);

    const wrapper = screen.getByTestId("default-link");
    const link = wrapper.querySelector("a");
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
    const wrapper = screen.getByTestId("link-inline");
    const link = wrapper.querySelector("a");

    expect(link).toHaveClass("bx--link--inline");
    expect(link?.querySelector(".bx--link__icon")).not.toBeInTheDocument();
  });
});
