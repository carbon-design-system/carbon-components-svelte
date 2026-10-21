import { fireEvent, render, screen } from "@testing-library/svelte";
import Add from "carbon-icons-svelte/lib/Add.svelte";
import { user } from "../utils/user";
import ChatButton from "./ChatButton.test.svelte";
import ChatButtonSkeleton from "./ChatButtonSkeleton.test.svelte";

describe("ChatButton", () => {
  it("renders a primary, default-size Button with the chat class", () => {
    render(ChatButton);

    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveClass("bx--btn", "bx--chat-btn", "bx--btn--primary");
    expect(button).not.toHaveClass("bx--btn--sm", "bx--btn--field");
    expect(button).not.toHaveClass("bx--chat-btn--quick-action");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it.each(["primary", "secondary", "tertiary", "ghost", "danger"] as const)(
    "renders the %s kind",
    (kind) => {
      render(ChatButton, { props: { buttonProps: { kind } } });

      expect(screen.getByRole("button")).toHaveClass(
        "bx--chat-btn",
        `bx--btn--${kind}`,
      );
    },
  );

  it.each([
    ["field", "bx--btn--field"],
    ["small", "bx--btn--sm"],
  ] as const)("renders the %s size", (size, className) => {
    render(ChatButton, { props: { buttonProps: { size } } });

    expect(screen.getByRole("button")).toHaveClass("bx--chat-btn", className);
  });

  it("marks a button with an icon, and renders the icon", () => {
    render(ChatButton, { props: { buttonProps: { icon: Add } } });

    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveClass("bx--chat-btn--with-icon");
    expect(button).not.toHaveClass("bx--btn--icon-only");
    expect(button.querySelector("svg.bx--btn__icon")).toBeInTheDocument();
  });

  it("renders a quick action as a small ghost button, whatever the kind and size", () => {
    render(ChatButton, {
      props: {
        buttonProps: { quickAction: true, kind: "primary", size: "field" },
      },
    });

    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveClass(
      "bx--chat-btn",
      "bx--chat-btn--quick-action",
      "bx--btn--ghost",
      "bx--btn--sm",
    );
    expect(button).not.toHaveClass("bx--btn--primary", "bx--btn--field");
    expect(button).not.toHaveClass("bx--chat-btn--quick-action--selected");
  });

  it("exposes a quick action's selected state with aria-pressed", async () => {
    const { rerender } = render(ChatButton, {
      props: { buttonProps: { quickAction: true } },
    });

    const button = screen.getByRole("button", { name: "Ask AI" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await rerender({ buttonProps: { quickAction: true, selected: true } });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("bx--chat-btn--quick-action--selected");
  });

  it("ignores selected on a button that isn't a quick action", () => {
    render(ChatButton, { props: { buttonProps: { selected: true } } });

    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-pressed");
    expect(button).not.toHaveClass("bx--chat-btn--quick-action--selected");
  });

  it("leaves aria-pressed off a quick action rendered as a link", () => {
    render(ChatButton, {
      props: {
        buttonProps: { quickAction: true, selected: true, href: "#ask" },
      },
    });

    const link = screen.getByRole("link", { name: "Ask AI" });
    expect(link).toHaveClass("bx--chat-btn--quick-action--selected");
    expect(link).not.toHaveAttribute("aria-pressed");
  });

  it("disables the button and blocks clicks", async () => {
    const onClick = vi.fn();
    render(ChatButton, {
      props: { buttonProps: { quickAction: true, disabled: true }, onClick },
    });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bx--btn--disabled");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps a selected quick action pressed when disabled", () => {
    render(ChatButton, {
      props: {
        buttonProps: { quickAction: true, selected: true, disabled: true },
      },
    });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("forwards click, mouse and focus events", async () => {
    const handlers = {
      onClick: vi.fn(),
      onMouseDown: vi.fn(),
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onMouseOver: vi.fn(),
      onMouseEnter: vi.fn(),
      onMouseLeave: vi.fn(),
    };
    render(ChatButton, { props: handlers });

    const button = screen.getByRole("button");
    await user.click(button);
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    button.blur();

    for (const handler of Object.values(handlers)) {
      expect(handler).toHaveBeenCalled();
    }
  });

  it("forwards rest props and merges the class", () => {
    render(ChatButton, {
      props: {
        buttonProps: {
          id: "ask",
          type: "submit",
          class: "my-chip",
          "aria-label": "Ask the assistant",
          "data-testid": "chat-button",
        },
      },
    });

    const button = screen.getByTestId("chat-button");
    expect(button).toHaveAttribute("id", "ask");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAccessibleName("Ask the assistant");
    expect(button).toHaveClass("bx--btn", "bx--chat-btn", "my-chip");
  });

  it("binds ref to the button", () => {
    const { component } = render(ChatButton);

    expect(component.ref).toBe(screen.getByRole("button"));
  });
});

describe("ChatButtonSkeleton", () => {
  it("renders a pill-shaped button placeholder", () => {
    render(ChatButtonSkeleton);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton.tagName).toBe("DIV");
    expect(skeleton).toHaveClass("bx--skeleton", "bx--btn", "bx--chat-btn");
    expect(skeleton).not.toHaveClass("bx--btn--sm", "bx--btn--field");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    ["field", "bx--btn--field"],
    ["small", "bx--btn--sm"],
  ] as const)("renders the %s size", (size, className) => {
    render(ChatButtonSkeleton, { props: { buttonProps: { size } } });

    expect(screen.getByTestId("skeleton")).toHaveClass(
      "bx--chat-btn",
      className,
    );
  });

  it("forwards rest props and merges the class", () => {
    render(ChatButtonSkeleton, {
      props: { buttonProps: { class: "my-skeleton", id: "loading-chip" } },
    });

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("bx--chat-btn", "my-skeleton");
    expect(skeleton).toHaveAttribute("id", "loading-chip");
  });
});
