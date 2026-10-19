import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import ToggleForm from "./Toggle.form.test.svelte";

describe("Toggle form participation", () => {
  describe("submitted value", () => {
    it('submits "on" while toggled by default', () => {
      render(ToggleForm, { props: { toggled: true } });

      expect(new FormData(getForm()).get("notify")).toBe("on");
    });

    it("submits a custom value while toggled", () => {
      render(ToggleForm, { props: { toggled: true, value: "yes" } });

      expect(new FormData(getForm()).get("notify")).toBe("yes");
    });

    it("omits the field while untoggled", () => {
      render(ToggleForm, { props: { value: "yes" } });

      expect(new FormData(getForm()).has("notify")).toBe(false);
    });
  });

  it("keeps the first click after the DOM changed without an event", async () => {
    const onToggle = vi.fn();
    render(ToggleForm, { props: { toggled: true, onToggle } });
    const toggle = screen.getByRole("switch");
    assert(toggle instanceof HTMLInputElement);

    toggle.checked = false;
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(onToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { toggled: true } }),
    );
  });

  it("toggles normally when the DOM and state agree", async () => {
    const onToggle = vi.fn();
    render(ToggleForm, { props: { onToggle } });
    const toggle = screen.getByRole("switch");

    await user.click(toggle);
    expect(onToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { toggled: true } }),
    );

    await user.click(toggle);
    expect(onToggle).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { toggled: false } }),
    );
  });

  describe("form reset", () => {
    it("syncs toggled to the switch's default state without firing toggle", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { toggled: true, onToggle } });
      const toggle = screen.getByRole("switch");

      // Click off, then on again, so the DOM and state still agree at true.
      await user.click(toggle);
      await user.click(toggle);
      onToggle.mockClear();

      await resetForm();

      expect(toggle).not.toBeChecked();
      expect(getBoundText()).toBe("false");
      expect(new FormData(getForm()).has("notify")).toBe(false);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("follows the switch's default state, as with server-rendered markup", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { toggled: true, onToggle } });
      const toggle = screen.getByRole("switch");
      assert(toggle instanceof HTMLInputElement);
      // Server-rendered markup carries the state as the `checked` attribute.
      toggle.defaultChecked = true;

      await user.click(toggle);
      expect(getBoundText()).toBe("false");
      onToggle.mockClear();

      await resetForm();

      expect(toggle).toBeChecked();
      expect(getBoundText()).toBe("true");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("keeps a read-only switch's state", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, {
        props: { toggled: true, readonly: true, onToggle },
      });
      const toggle = screen.getByRole("switch");

      await resetForm();

      expect(toggle).toBeChecked();
      expect(getBoundText()).toBe("true");
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
