import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import OutboundLink from "./OutboundLink.test.svelte";

describe("OutboundLink", () => {
  it("opens in a new tab with secure rel attributes", () => {
    render(OutboundLink);
    const link = within(screen.getByTestId("default")).getByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lets a consumer rel override the default rel", () => {
    render(OutboundLink);
    const link = within(screen.getByTestId("rel-override")).getByRole("link");

    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "nofollow");
  });

  it("forwards focus, blur, keydown, and keyup", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeydown = vi.fn();
    const onKeyup = vi.fn();
    render(OutboundLink, { props: { onFocus, onBlur, onKeydown, onKeyup } });

    const link = within(screen.getByTestId("default")).getByRole("link");
    link.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.keyboard("a");
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onKeyup).toHaveBeenCalledTimes(1);

    link.blur();
    expect(onBlur).toHaveBeenCalledTimes(1);
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
