import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flushDismiss";
import { user } from "../utils/user";
import Toggletip from "./ToggletipDispatchGuard.test.svelte";
import ToggletipWithInteractiveContent from "./ToggletipWithInteractiveContent.test.svelte";

/**
 * Listeners are enabled on the animation frame after opening, on top of the
 * `dismiss` action's own deferred registration. Wait for that frame before
 * flushing the `dismiss` action.
 */
const flush = async () => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await flushDismiss();
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

  it("should not close when clicking an interactive element inside the content", async () => {
    const onClose = vi.fn();
    render(ToggletipWithInteractiveContent, {
      props: { open: false, onClose },
    });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    await flush();

    await user.click(screen.getByTestId("inside-button"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should set aria-describedby on the trigger so content is announced the first time it opens", async () => {
    render(Toggletip, { props: { open: false } });

    const trigger = screen.getByRole("button", { name: "Information" });
    expect(trigger).not.toHaveAttribute("aria-describedby");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-describedby");
  });
});
