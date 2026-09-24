import { observeModalClose } from "../../src/Portal/portal-utils.js";
import { flushMacrotask } from "../utils/flush-macrotask";

describe("observeModalClose", () => {
  it("returns no-op when element has no modal ancestor", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const onClose = vi.fn();
    const disconnect = observeModalClose(element, onClose);

    expect(typeof disconnect).toBe("function");
    disconnect();
    expect(onClose).not.toHaveBeenCalled();

    element.remove();
  });

  it("calls onClose when modal loses is-visible class", async () => {
    const modal = document.createElement("div");
    modal.classList.add("bx--modal", "is-visible");
    const element = document.createElement("div");
    modal.appendChild(element);
    document.body.appendChild(modal);

    const onClose = vi.fn();
    const disconnect = observeModalClose(element, onClose);

    modal.classList.remove("is-visible");
    await flushMacrotask();

    expect(onClose).toHaveBeenCalledTimes(1);
    disconnect();
    modal.remove();
  });

  it("does not call onClose when modal retains is-visible", async () => {
    const modal = document.createElement("div");
    modal.classList.add("bx--modal", "is-visible");
    const element = document.createElement("div");
    modal.appendChild(element);
    document.body.appendChild(modal);

    const onClose = vi.fn();
    const disconnect = observeModalClose(element, onClose);

    modal.classList.add("some-other-class");
    await flushMacrotask();
    expect(onClose).not.toHaveBeenCalled();

    disconnect();
    modal.remove();
  });

  it("stops observing after disconnect", async () => {
    const modal = document.createElement("div");
    modal.classList.add("bx--modal", "is-visible");
    const element = document.createElement("div");
    modal.appendChild(element);
    document.body.appendChild(modal);

    const onClose = vi.fn();
    const disconnect = observeModalClose(element, onClose);

    disconnect();

    modal.classList.remove("is-visible");
    await flushMacrotask();

    expect(onClose).not.toHaveBeenCalled();
    modal.remove();
  });
});
