import { render, screen } from "@testing-library/svelte";
import TextToolbarComponent from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TextToolbar from "./TextToolbar.test.svelte";

describe("TextToolbar", () => {
  it("renders role=toolbar with the provided aria-label", () => {
    render(TextToolbar);

    expect(
      screen.getByRole("toolbar", { name: "Formatting" }),
    ).toBeInTheDocument();
  });

  it("falls back to a default accessible name", () => {
    render(TextToolbarComponent);

    expect(
      screen.getByRole("toolbar", { name: "Text formatting" }),
    ).toBeInTheDocument();
  });

  it("exposes a single tab stop with roving tabindex", async () => {
    render(TextToolbar);
    await tick();

    const one = screen.getByTestId("one");
    const two = screen.getByTestId("two");
    const three = screen.getByTestId("three");

    expect(one).toHaveAttribute("tabindex", "0");
    expect(two).toHaveAttribute("tabindex", "-1");
    expect(three).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with arrow keys without leaving the toolbar", async () => {
    render(TextToolbar);
    await tick();

    const one = screen.getByTestId("one");
    const two = screen.getByTestId("two");

    one.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(two);
    expect(two).toHaveAttribute("tabindex", "0");
    expect(one).toHaveAttribute("tabindex", "-1");
  });

  it("wraps from the first control to the last with ArrowLeft", async () => {
    render(TextToolbar);
    await tick();

    const one = screen.getByTestId("one");
    const three = screen.getByTestId("three");

    one.focus();
    await user.keyboard("{ArrowLeft}");

    expect(document.activeElement).toBe(three);
  });

  it("Home and End jump to the first and last controls", async () => {
    render(TextToolbar);
    await tick();

    const one = screen.getByTestId("one");
    const three = screen.getByTestId("three");

    one.focus();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(three);

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(one);
  });

  it("skips disabled controls during arrow navigation", async () => {
    render(TextToolbar, { props: { disabledSecond: true } });
    await tick();

    const one = screen.getByTestId("one");
    const three = screen.getByTestId("three");

    one.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(three);
  });
});
