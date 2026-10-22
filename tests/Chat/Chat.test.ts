import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import Chat from "./Chat.test.svelte";

describe("Chat", () => {
  it("renders a focusable, named log around a list of messages", () => {
    render(Chat);

    const log = screen.getByRole("log", { name: "Conversation with Sam" });
    expect(log).toHaveAttribute("tabindex", "0");
    within(log).getByRole("list");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("names each message's author, showing it on the first of a group", () => {
    render(Chat);

    expect(
      within(screen.getByTestId("first")).getByText("Sam"),
    ).not.toHaveClass("bx--visually-hidden");
    expect(within(screen.getByTestId("second")).getByText("Sam")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(within(screen.getByTestId("mine")).getByText("You")).toHaveClass(
      "bx--visually-hidden",
    );
  });

  it("holds a streaming message's announcement until it's done", () => {
    render(Chat, { streaming: true });

    expect(screen.getByTestId("second")).toHaveAttribute("aria-busy", "true");
  });

  it("shows the avatar on the first of a run and leaves it out after", () => {
    render(Chat);

    expect(screen.getByTestId("avatar-1")).toBeInTheDocument();
    expect(screen.queryByTestId("avatar-2")).toBeNull();
    expect(screen.getByTestId("second")).toHaveClass(
      "bx--chat-message--continued",
    );
  });

  it("aligns my messages to the end and renders the meta line", () => {
    render(Chat);

    const mine = screen.getByTestId("mine");
    expect(mine).toHaveClass("bx--chat-message--me");
    expect(mine.querySelector(".bx--chat-message__avatar")).toBeNull();
    expect(screen.getByText("9:41").parentElement).toHaveClass(
      "bx--chat-message__meta",
    );
  });

  it("announces a typing indicator as a status", () => {
    render(Chat, { typing: true });

    expect(screen.getByRole("status")).toHaveTextContent("Sam is typing");
  });

  it("puts attachments under the bubble, not inside it", () => {
    render(Chat);

    const image = screen.getByRole("img", { name: "Receipt" });
    expect(image.closest(".bx--chat-message__bubble")).toBeNull();
    expect(image.closest(".bx--chat-message__attachments")).not.toBeNull();
  });

  it("shows the delivery status, and a Retry button when it failed", async () => {
    const { component, rerender } = render(Chat, { status: "read" });
    expect(screen.getByText("Read")).toBeInTheDocument();

    await rerender({ status: "failed" });
    expect(screen.getByText("Not sent")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(component.retries).toBe(1);
  });
});
