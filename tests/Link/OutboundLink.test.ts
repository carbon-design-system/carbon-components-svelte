import { render, screen, within } from "@testing-library/svelte";
import OutboundLink from "./OutboundLink.test.svelte";

describe("OutboundLink", () => {
  it("opens in a new tab with secure rel attributes", () => {
    render(OutboundLink);
    const link = within(screen.getByTestId("default")).getByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("announces that the link opens in a new tab", () => {
    render(OutboundLink);
    const container = screen.getByTestId("default");

    // The announcement is part of the link's accessible name.
    expect(
      within(container).getByRole("link", {
        name: "Carbon Design System (opens in a new tab)",
      }),
    ).toBeInTheDocument();

    // It is conveyed via visually-hidden text, so it is not shown visually.
    const assistiveText = within(container)
      .getByText("(opens in a new tab)")
      .closest("span");
    assert(assistiveText);
    expect(assistiveText).toHaveClass("bx--visually-hidden");
  });

  it("keeps the launch icon decorative (hidden from screen readers)", () => {
    render(OutboundLink);
    const link = within(screen.getByTestId("default")).getByRole("link");

    const icon = link.querySelector(".bx--link__icon svg");
    assert(icon);
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("supports customizing the assistive text", () => {
    render(OutboundLink);
    const container = screen.getByTestId("custom");

    expect(
      within(container).getByRole("link", {
        name: "Carbon Design System (opens in a new window)",
      }),
    ).toBeInTheDocument();
    expect(
      within(container).queryByText("(opens in a new tab)"),
    ).not.toBeInTheDocument();
  });

  it("can opt out of the announcement with an empty string", () => {
    render(OutboundLink);
    const container = screen.getByTestId("empty");

    expect(
      within(container).getByRole("link", { name: "Carbon Design System" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".bx--visually-hidden"),
    ).not.toBeInTheDocument();
  });
});
