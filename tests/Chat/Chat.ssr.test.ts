// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Chat from "./Chat.test.svelte";

describe("Chat server render", () => {
  it("renders a streaming message busy, with its start announced and no jump button", () => {
    const { document } = renderSSR(Chat, { streaming: true });

    const reply = document.querySelector('[data-testid="second"]');
    expect(reply?.getAttribute("aria-busy")).toBe("true");
    expect(reply?.querySelector('[role="status"]')?.textContent).toBe(
      "Response started",
    );
    expect(
      reply
        ?.querySelector(".bx--chat-message__bubble")
        ?.getAttribute("aria-live"),
    ).toBe("off");
    expect(document.querySelector(".bx--chat-log__jump button")).toBeNull();
  });

  it("renders a message that isn't streaming with no status of its own", () => {
    const { document } = renderSSR(Chat);

    expect(
      document.querySelector('[data-testid="second"] [role="status"]'),
    ).toBeNull();
  });
});
