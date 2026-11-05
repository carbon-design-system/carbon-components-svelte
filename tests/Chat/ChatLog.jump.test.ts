import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ChatJump from "./Chat.jump.test.svelte";

/** jsdom has no layout, so give the log a height and a scroll position. */
function scrollTo(log: HTMLElement, top: number) {
  Object.defineProperty(log, "scrollHeight", {
    value: 1000,
    configurable: true,
  });
  Object.defineProperty(log, "clientHeight", {
    value: 200,
    configurable: true,
  });
  log.scrollTop = top;
  log.dispatchEvent(new Event("scroll"));
}

describe("ChatLog jump to latest", () => {
  it("shows a button once the reader scrolls back, and jumps to the latest", async () => {
    const { component } = render(ChatJump);
    const log = screen.getByRole("log");
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();

    scrollTo(log, 100);
    const jump = await screen.findByRole("button", { name: "Jump to latest" });
    expect(screen.getByTestId("at-latest")).toHaveTextContent("false");

    await user.click(jump);

    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
    expect(screen.getByTestId("at-latest")).toHaveTextContent("true");
    expect(component.jumps).toBe(1);
    expect(log).toHaveFocus();
  });

  it("keeps the button out of the log's announcements", async () => {
    render(ChatJump);
    scrollTo(screen.getByRole("log"), 0);

    const jump = await screen.findByRole("button", { name: "Jump to latest" });

    expect(jump.closest(".bx--chat-log__jump")).toHaveAttribute(
      "aria-live",
      "off",
    );
  });

  it("doesn't show it near the end, within a message's height", async () => {
    render(ChatJump);

    scrollTo(screen.getByRole("log"), 760);
    await Promise.resolve();

    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });
});
