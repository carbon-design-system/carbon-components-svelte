// @vitest-environment node
import { flushRejectionQueue } from "../utils/absorb-unhandled-rejection";
import { renderSSR } from "../utils/ssr";
import Menu from "./Menu.ssr.test.svelte";

describe("Menu server render", () => {
  it("renders nothing while closed", () => {
    expect(renderSSR(Menu).html).toBe("");
  });

  it("renders its items while open without a rejected focus task", async () => {
    const onRejection = vi.fn();
    process.on("unhandledRejection", onRejection);

    const { document } = renderSSR(Menu, { open: true });
    await flushRejectionQueue();
    process.off("unhandledRejection", onRejection);

    expect(
      [...document.querySelectorAll('[role="menuitem"]')].map(
        (item) => item.textContent,
      ),
    ).toEqual(["Copy", "Paste"]);
    expect(onRejection).not.toHaveBeenCalled();
  });
});
