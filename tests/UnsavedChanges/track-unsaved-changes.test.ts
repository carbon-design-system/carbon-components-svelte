import { render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import { createUnsavedChanges } from "../../src/UnsavedChanges/unsaved-changes.js";
import { flushFormReset } from "../utils/flush-form-reset";
import { flushMacrotask } from "../utils/flush-macrotask";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import Native from "./TrackUnsavedChanges.native.test.svelte";
import Plain from "./TrackUnsavedChanges.plain.test.svelte";
import Tracked from "./TrackUnsavedChanges.test.svelte";

function unloadPrevented() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("trackUnsavedChanges", () => {
  it("tracks a control with no name", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store });
    const input = screen.getByLabelText("Name");

    expect(get(store.dirty)).toBe(false);
    await user.type(input, "!");
    expect(get(store.dirty)).toBe(true);
    await user.type(input, "{Backspace}");
    expect(get(store.dirty)).toBe(false);
  });

  it("reads a checkbox and a radio group against their baselines", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store });

    await user.click(screen.getByLabelText("Agree"));
    expect(get(store.dirty)).toBe(true);
    await user.click(screen.getByLabelText("Agree"));
    expect(get(store.dirty)).toBe(false);

    // Checking "Pro" unchecks "Free" without an event for it, so returning
    // to "Free" must clear both.
    await user.click(screen.getByLabelText("Pro"));
    expect(get(store.dirty)).toBe(true);
    await user.click(screen.getByLabelText("Free"));
    expect(get(store.dirty)).toBe(false);
  });

  it("goes clean after a reset", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store });
    await user.type(screen.getByLabelText("Name"), "x");
    expect(get(store.dirty)).toBe(true);

    getForm().reset();
    await flushFormReset();
    expect(get(store.dirty)).toBe(false);
  });

  it("stays dirty after a canceled reset", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store });
    const form = getForm();
    form.addEventListener("reset", (event) => event.preventDefault());
    await user.type(screen.getByLabelText("Name"), "x");

    form.reset();
    await flushFormReset();
    expect(get(store.dirty)).toBe(true);
  });

  it("takes a new baseline on markSaved", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store });
    const input = screen.getByLabelText("Name");
    await user.type(input, "x");

    store.markSaved();
    expect(get(store.dirty)).toBe(false);
    await user.type(input, "{Backspace}");
    expect(get(store.dirty)).toBe(true);
  });

  it("does not count a field that appears, only a change to it", async () => {
    const store = createUnsavedChanges();
    const { rerender } = render(Tracked, { store });

    await rerender({ showExtra: true });
    await flushMacrotask();
    expect(get(store.dirty)).toBe(false);

    await user.type(screen.getByLabelText("Extra"), "x");
    expect(get(store.dirty)).toBe(true);
  });

  it("clears the source when the form unmounts", async () => {
    const store = createUnsavedChanges();
    const { unmount } = render(Tracked, { store });
    await user.type(screen.getByLabelText("Name"), "x");
    expect(get(store.dirty)).toBe(true);

    unmount();
    expect(get(store.dirty)).toBe(false);
    expect(unloadPrevented()).toBe(false);
  });

  it("baselines the values bound to a form it sits on", async () => {
    const store = createUnsavedChanges();
    render(Native, { store });
    expect(get(store.dirty)).toBe(false);

    await user.type(screen.getByLabelText("Name"), "!");
    await user.click(screen.getByLabelText("Agree"));
    await user.selectOptions(screen.getByLabelText("Color"), "red");
    expect(get(store.count)).toBe(1);

    await user.type(screen.getByLabelText("Name"), "{Backspace}");
    await user.click(screen.getByLabelText("Agree"));
    await user.selectOptions(screen.getByLabelText("Color"), "green");
    expect(get(store.dirty)).toBe(false);
  });

  it("works through FluidForm's actions", async () => {
    const store = createUnsavedChanges();
    render(Tracked, { store, fluid: true });

    await user.type(screen.getByLabelText("Name"), "x");
    expect(get(store.dirty)).toBe(true);
  });

  describe("submit", () => {
    function submit(form: HTMLFormElement, prevent: boolean) {
      form.addEventListener("submit", (event) => {
        if (prevent) event.preventDefault();
      });
      const event = new Event("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      return event;
    }

    it("quiets the unload prompt for a native submit and stays dirty", async () => {
      const store = createUnsavedChanges();
      render(Tracked, { store });
      await user.type(screen.getByLabelText("Name"), "x");
      expect(unloadPrevented()).toBe(true);

      submit(getForm(), false);
      expect(unloadPrevented()).toBe(false);
      expect(get(store.dirty)).toBe(true);
    });

    it("keeps the guard armed when a handler takes over and the save fails", async () => {
      const store = createUnsavedChanges();
      render(Tracked, { store });
      await user.type(screen.getByLabelText("Name"), "x");

      submit(getForm(), true);
      expect(get(store.dirty)).toBe(true);
      expect(unloadPrevented()).toBe(true);
    });
  });

  describe("hidden inputs", () => {
    it("counts a hidden input a component rewrites without an event", async () => {
      const store = createUnsavedChanges();
      render(Plain, { store });
      const box = screen.getByTestId("box");
      box.insertAdjacentHTML(
        "beforeend",
        '<input type="hidden" name="k" value="1" />',
      );
      await flushMacrotask();
      store.markSaved();
      await flushMacrotask();

      const hidden = box.querySelector<HTMLInputElement>("[name=k]");
      assert(hidden);
      hidden.value = "2";
      await flushMacrotask();
      expect(get(store.dirty)).toBe(true);

      hidden.value = "1";
      await flushMacrotask();
      expect(get(store.dirty)).toBe(false);

      hidden.remove();
      await flushMacrotask();
      expect(get(store.dirty)).toBe(true);
    });
  });

  describe("explicit mode", () => {
    it("mirrors the flag and follows updates", async () => {
      const store = createUnsavedChanges();
      const { rerender } = render(Plain, { store, dirty: true });
      expect(get(store.count)).toBe(1);

      await rerender({ dirty: false });
      expect(get(store.count)).toBe(0);
      await rerender({ dirty: true });
      expect(get(store.count)).toBe(1);
    });

    it("does not diff controls", async () => {
      const store = createUnsavedChanges();
      render(Plain, { store, dirty: false });

      await user.type(screen.getByLabelText("Plain"), "x");
      expect(get(store.dirty)).toBe(false);
    });
  });
});
