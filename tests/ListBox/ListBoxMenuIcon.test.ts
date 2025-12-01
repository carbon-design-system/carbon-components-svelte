import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import ListBoxMenuIcon from "./ListBoxMenuIcon.test.svelte";

describe("ListBoxMenuIcon", () => {
  it("should render with default props", () => {
    render(ListBoxMenuIcon);

    const icon = document.querySelector(".bx--list-box__menu-icon");
    expect(icon).toBeInTheDocument();
  });

  it("should render chevron icon", () => {
    render(ListBoxMenuIcon);

    const svg = document.querySelector(".bx--list-box__menu-icon svg");
    expect(svg).toBeInTheDocument();
  });

  it("should handle closed state", () => {
    render(ListBoxMenuIcon, { props: { open: false } });

    const icon = document.querySelector(".bx--list-box__menu-icon");
    expect(icon).not.toHaveClass("bx--list-box__menu-icon--open");
  });

  it("should handle open state", () => {
    render(ListBoxMenuIcon, { props: { open: true } });

    const icon = document.querySelector(".bx--list-box__menu-icon");
    expect(icon).toHaveClass("bx--list-box__menu-icon--open");
  });

  it("should show 'Open menu' label when closed", () => {
    render(ListBoxMenuIcon, { props: { open: false } });

    const svg = document.querySelector(".bx--list-box__menu-icon svg");
    expect(svg).toHaveAttribute("aria-label", "Open menu");
  });

  it("should show 'Close menu' label when open", () => {
    render(ListBoxMenuIcon, { props: { open: true } });

    const svg = document.querySelector(".bx--list-box__menu-icon svg");
    expect(svg).toHaveAttribute("aria-label", "Close menu");
  });

  it("should use custom translations when translateWithId is provided", async () => {
    const customTranslations = {
      open: "Custom open text",
      close: "Custom close text",
    } as const;

    const props = {
      open: false,
      translateWithId: (id: keyof typeof customTranslations) =>
        customTranslations[id],
    } satisfies ComponentProps<ListBoxMenuIcon>;

    const { component } = render(ListBoxMenuIcon, { props });

    let svg = document.querySelector(".bx--list-box__menu-icon svg");
    expect(svg).toHaveAttribute("aria-label", "Custom open text");

    component.open = true;
    await user.click(document.body); // trigger update

    svg = document.querySelector(".bx--list-box__menu-icon svg");
    expect(svg).toHaveAttribute("aria-label", "Custom close text");
  });

  it("should handle click events", async () => {
    const clickHandler = vi.fn();
    render(ListBoxMenuIcon, { props: { onclick: clickHandler } });

    const icon = document.querySelector(".bx--list-box__menu-icon");
    assert(icon);
    await user.click(icon);

    expect(clickHandler).toHaveBeenCalled();
  });

  it("should prevent default on click", () => {
    render(ListBoxMenuIcon);

    const icon = document.querySelector(".bx--list-box__menu-icon");
    assert(icon);

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    icon.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it("should apply custom attributes", () => {
    render(ListBoxMenuIcon, {
      props: {
        "data-testid": "custom-icon",
      },
    });

    const icon = document.querySelector(".bx--list-box__menu-icon");
    expect(icon).toHaveAttribute("data-testid", "custom-icon");
  });
});
