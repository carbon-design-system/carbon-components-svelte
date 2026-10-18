import { render, screen } from "@testing-library/svelte";
import Fixture from "./HeaderNavMenuTrigger.test.svelte";

describe("HeaderNavMenu trigger content", () => {
  it("renders only the text and chevron by default", () => {
    render(Fixture);

    const trigger = screen.getByRole("menuitem", { name: "Plain" });
    const svgs = trigger.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    expect(svgs[0]).toHaveClass("bx--header__menu-arrow");
  });

  it("renders the icon prop between the text and the chevron", () => {
    render(Fixture);

    const trigger = screen.getByRole("menuitem", { name: "With icon" });
    const [icon, chevron] = Array.from(trigger.querySelectorAll("svg"));
    expect(icon).not.toHaveClass("bx--header__menu-arrow");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(chevron).toHaveClass("bx--header__menu-arrow");
    expect(trigger.lastElementChild).toBe(chevron);
    expect(chevron.previousElementSibling).toBe(icon);
  });

  it("supports custom text and icon slots", () => {
    render(Fixture);

    const text = screen.getByTestId("custom-text");
    const icon = screen.getByTestId("slot-icon");
    const trigger = text.closest("a");
    expect(trigger).toHaveTextContent("Custom label");
    expect(trigger).not.toHaveTextContent("Ignored");
    expect(icon.parentElement).toBe(trigger);
    expect(icon.nextElementSibling).toHaveClass("bx--header__menu-arrow");
  });
});

describe("HeaderNavMenu accessible names", () => {
  it("names the menu with the trigger", () => {
    render(Fixture);

    const trigger = screen.getByRole("menuitem", { name: "Plain" });
    const menu = screen.getByRole("menu", { name: "Plain", hidden: true });
    expect(trigger.id).not.toBe("");
    expect(menu).toHaveAttribute("aria-labelledby", trigger.id);
    expect(menu).not.toHaveAttribute("aria-label");
  });

  it("follows slotted trigger content", () => {
    render(Fixture);

    expect(
      screen.getByRole("menuitem", { name: "Custom label" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menu", { name: "Custom label", hidden: true }),
    ).toBeInTheDocument();
  });
});
