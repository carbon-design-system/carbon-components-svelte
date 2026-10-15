import { render, screen } from "@testing-library/svelte";
import Chat from "./Chat.test.svelte";

describe("Chat", () => {
  it("renders a named log of list items", () => {
    render(Chat);

    const log = screen.getByRole("log", { name: "Conversation with Sam" });
    expect(log.tagName).toBe("OL");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("Today").closest("li")).toHaveClass(
      "bx--chat-divider",
    );
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
    expect(screen.getByText("Read").parentElement).toHaveClass(
      "bx--chat-message__meta",
    );
  });

  it("announces a typing indicator as a status", () => {
    render(Chat, { typing: true });

    expect(screen.getByRole("status")).toHaveTextContent("Sam is typing");
  });
});
