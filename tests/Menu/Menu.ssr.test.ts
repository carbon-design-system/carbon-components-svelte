// @vitest-environment node
import { flushRejectionQueue } from "../utils/absorb-unhandled-rejection";
import { renderSSR } from "../utils/ssr";
import Menu from "./Menu.ssr.test.svelte";

describe("Menu server render", () => {
  it("renders nothing while closed", () => {
    expect(renderSSR(Menu).html).toBe("");
  });

  // The menu is portalled, so its items mount on the client only.
  it("renders nothing while open without a rejected focus task", async () => {
    const onRejection = vi.fn();
    process.on("unhandledRejection", onRejection);

    const { html } = renderSSR(Menu, { open: true });
    await flushRejectionQueue();
    process.off("unhandledRejection", onRejection);

    expect(html).toBe("");
    expect(onRejection).not.toHaveBeenCalled();
  });
});
