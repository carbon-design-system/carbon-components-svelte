import { render, screen } from "@testing-library/svelte";
import Loading from "./Loading.test.svelte";

describe("Loading", () => {
  it("renders with default props", () => {
    render(Loading);
    const wrapper = screen.getByTestId("default-loader");

    // Should have overlay by default
    expect(wrapper.querySelector(".bx--loading-overlay")).toBeInTheDocument();

    // Should be active by default
    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toBeInTheDocument();
    expect(loader).not.toHaveClass("bx--loading--stop");

    // Should have correct ARIA attributes
    expect(loader).toHaveAttribute("aria-atomic", "true");
    expect(loader).toHaveAttribute("aria-live", "assertive");

    // Should have default description
    const title = wrapper.querySelector("title");
    expect(title).toHaveTextContent("loading");
  });

  it("renders without overlay", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-no-overlay");

    // Should not have overlay
    expect(
      wrapper.querySelector(".bx--loading-overlay"),
    ).not.toBeInTheDocument();

    // Should still have loader
    expect(wrapper.querySelector(".bx--loading")).toBeInTheDocument();
  });

  it("supports small variant", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-small");

    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toHaveClass("bx--loading--small");

    // Small variant should have background circle
    const backgroundCircle = wrapper.querySelector(".bx--loading__background");
    expect(backgroundCircle).toBeInTheDocument();
    expect(backgroundCircle).toHaveAttribute("r", "42");

    // Should have stroke circle with correct radius
    const strokeCircle = wrapper.querySelector(".bx--loading__stroke");
    expect(strokeCircle).toHaveAttribute("r", "42");
  });

  it("supports inactive state", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-inactive");

    // Overlay should have stop class
    const overlay = wrapper.querySelector(".bx--loading-overlay");
    expect(overlay).toHaveClass("bx--loading-overlay--stop");

    // Loader should have stop class
    const loader = wrapper.querySelector(".bx--loading");
    expect(loader).toHaveClass("bx--loading--stop");

    // ARIA live should be off when inactive
    expect(loader).toHaveAttribute("aria-live", "off");
  });

  it("supports custom description", () => {
    render(Loading);
    const wrapper = screen.getByTestId("loader-description");

    const title = wrapper.querySelector("title");
    expect(title).toHaveTextContent("Processing data...");
  });

  it("renders with correct spinner radius", () => {
    render(Loading);

    // Default (large) spinner
    const defaultWrapper = screen.getByTestId("default-loader");
    const defaultStroke = defaultWrapper.querySelector(".bx--loading__stroke");
    expect(defaultStroke).toHaveAttribute("r", "44");

    // Small spinner
    const smallWrapper = screen.getByTestId("loader-small");
    const smallStroke = smallWrapper.querySelector(".bx--loading__stroke");
    expect(smallStroke).toHaveAttribute("r", "42");
  });
});
