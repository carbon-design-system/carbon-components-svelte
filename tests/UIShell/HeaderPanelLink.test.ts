import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderPanelLink from "./HeaderPanelLink.test.svelte";
import HeaderPanelLinkElement from "./HeaderPanelLinkElement.test.svelte";
import Fixture from "./HeaderPanelLinkIcon.test.svelte";
import HeaderPanelLinkKeyboard from "./HeaderPanelLinkKeyboard.test.svelte";
import HeaderPanelLinkToggle from "./HeaderPanelLinkToggle.test.svelte";

describe("HeaderPanelLink", () => {
  it("renders an anchor with an href and a button without one", () => {
    render(HeaderPanelLink);

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "#docs");
    expect(link).toHaveClass("bx--switcher__item-link");

    const button = screen.getByRole("button", { name: "Switch theme" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bx--switcher__item-link");
  });

  it("marks only the selected link as current", () => {
    render(HeaderPanelLink);

    const current = screen.getByRole("button", { name: "Current" });
    expect(current).toHaveClass("bx--switcher__item-link--selected");
    expect(current).toHaveAttribute("aria-current", "page");

    expect(screen.getByRole("link", { name: "Docs" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.getByRole("button", { name: "Switch theme" }),
    ).not.toHaveAttribute("aria-current");
  });
});

describe("HeaderPanelLink element", () => {
  it("applies anchor-only and button-only attributes to the right element", async () => {
    const { component } = render(HeaderPanelLinkElement);

    const link = screen.getByRole("link", { name: "Alpha" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(component.ref).toBe(link);

    component.href = undefined;
    await tick();

    const button = screen.getByRole("button", { name: "Alpha" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("rel");
    expect(button).not.toHaveAttribute("href");
    expect(button).toHaveAttribute("aria-current", "page");
    expect(button).toHaveClass("bx--switcher__item-link--selected");
    expect(component.ref).toBe(button);
  });

  it("forwards click from both elements", async () => {
    const { component } = render(HeaderPanelLinkElement);

    await user.click(screen.getByRole("link", { name: "Alpha" }));
    expect(component.clicks).toBe(1);

    component.href = undefined;
    await tick();
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    expect(component.clicks).toBe(2);
  });
});

describe("HeaderPanelLink text and icon", () => {
  it("renders the text prop and a decorative icon after the label", () => {
    render(Fixture);

    const docs = screen.getByRole("link", { name: "Docs" });
    const icon = docs.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "16");
    expect(docs.lastElementChild).toBe(icon?.parentElement);
    expect(docs.lastElementChild).toHaveClass("bx--switcher__item-icon");
  });

  it("renders text on a button and omits the icon when unset", () => {
    render(Fixture);

    const plain = screen.getByRole("button", { name: "Plain" });
    expect(plain.querySelector("svg")).toBeNull();
    expect(plain.querySelector(".bx--switcher__item-icon")).toBeNull();
  });

  it("supports a custom icon slot", () => {
    render(Fixture);

    expect(screen.getByTestId("slot-icon")).toBeInTheDocument();
  });
});

const item = (name: string) =>
  screen.getByRole(name === "Beta" ? "button" : "link", { name });

describe("HeaderPanelLink keyboard navigation", () => {
  it("moves focus with ArrowDown and ArrowUp, wrapping at the ends", async () => {
    render(HeaderPanelLinkKeyboard);

    item("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Beta")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Gamma")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Alpha")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Gamma")).toHaveFocus();
  });
});

describe("HeaderPanelLinks with a disabled link", () => {
  it("skips the disabled link when moving with ArrowDown and ArrowUp", async () => {
    render(HeaderPanelLinkKeyboard, { props: { disableBeta: true } });

    item("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Gamma")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Alpha")).toHaveFocus();
  });
});

describe("HeaderPanelLink when href is toggled", () => {
  it("keeps arrow navigation pointing at the rendered element", async () => {
    const { component } = render(HeaderPanelLinkToggle);

    // Anchor to button.
    component.href = undefined;
    await tick();
    const alphaButton = screen.getByRole("button", { name: "Alpha" });

    screen.getByRole("button", { name: "Beta" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(alphaButton).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Beta" })).toHaveFocus();

    // And back to an anchor.
    component.href = "#alpha";
    await tick();
    const alphaLink = screen.getByRole("link", { name: "Alpha" });

    await user.keyboard("{ArrowUp}");
    expect(alphaLink).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("link", { name: "Gamma" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(alphaLink).toHaveFocus();
  });
});
