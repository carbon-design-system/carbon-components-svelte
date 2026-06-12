import { render, screen } from "@testing-library/svelte";
import BadgeIndicator from "./BadgeIndicator.test.svelte";

describe("BadgeIndicator", () => {
  it("renders an empty dot with no count", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("dot").querySelector("div");

    expect(badge).toHaveClass("bx--badge-indicator");
    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("treats count={0} as an empty dot", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("zero").querySelector("div");

    expect(badge).not.toHaveClass("bx--badge-indicator--count");
    expect(badge?.textContent?.trim()).toBe("");
  });

  it("renders a numbered count", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("count").querySelector("div");

    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("4");
  });

  it("renders the boundary value 999 as-is", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("boundary").querySelector("div");

    expect(badge).toHaveTextContent("999");
  });

  it("caps counts over 999 at '999+'", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("overflow").querySelector("div");

    expect(badge).toHaveTextContent("999+");
  });

  it("renders a string count as a custom label", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("label").querySelector("div");

    expect(badge).toHaveClass("bx--badge-indicator--count");
    expect(badge).toHaveTextContent("1.2k");
  });

  it("forwards rest props to the underlying element", () => {
    render(BadgeIndicator);
    const badge = screen.getByTestId("restprops").querySelector("div");

    expect(badge).toHaveAttribute("id", "notifications");
    expect(badge).toHaveClass("bx--badge-indicator", "custom");
  });
});
