import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Toggletip from "./ToggletipDispatchGuard.test.svelte";

/**
 * Listeners are enabled on the animation frame after opening; that state
 * change needs a Svelte `tick()` to reach the `dismiss` action's `update()`,
 * which itself defers the actual window listener registration by a further
 * macrotask. Flush all three before asserting.
 */
const flush = async () => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await tick();
  await new Promise((resolve) => setTimeout(resolve));
};

describe("Toggletip", () => {
  it("should not close when the browser window loses focus (e.g. switching tabs)", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    await flush();

    window.dispatchEvent(new Event("blur"));
    await tick();
    await tick();

    expect(onClose).not.toHaveBeenCalled();
  });
});
