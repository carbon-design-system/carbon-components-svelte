import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import ToggleForm from "./Toggle.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
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
    const toggle = screen.getByRole("switch") as HTMLInputElement;

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

  it("ignores clicks while readonly", async () => {
    const onToggle = vi.fn();
    render(ToggleForm, { props: { readonly: true, onToggle } });
    const toggle = screen.getByRole("switch");

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(onToggle).not.toHaveBeenCalled();
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

      getForm().reset();
      await flushFormReset();

      expect(toggle).not.toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("false");
      expect(new FormData(getForm()).has("notify")).toBe(false);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("unchecks the switch on reset even without prior interaction", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { toggled: true, onToggle } });
      const toggle = screen.getByRole("switch");

      expect(screen.getByTestId("bound").textContent).toBe("true");

      getForm().reset();
      await flushFormReset();

      expect(toggle).not.toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("false");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("follows the switch's default state, as with server-rendered markup", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { toggled: true, onToggle } });
      const toggle = screen.getByRole("switch") as HTMLInputElement;
      // Server-rendered markup carries the state as the `checked` attribute.
      toggle.defaultChecked = true;

      await user.click(toggle);
      expect(screen.getByTestId("bound").textContent).toBe("false");
      onToggle.mockClear();

      getForm().reset();
      await flushFormReset();

      expect(toggle).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("keeps a read-only switch's state", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, {
        props: { toggled: true, readonly: true, onToggle },
      });
      const toggle = screen.getByRole("switch");

      getForm().reset();
      await flushFormReset();

      expect(toggle).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("leaves the state alone when the reset is canceled", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { toggled: true, onToggle } });
      const toggle = screen.getByRole("switch");
      getForm().addEventListener("reset", (event) => event.preventDefault());

      getForm().reset();
      await flushFormReset();

      expect(toggle).toBeChecked();
      expect(screen.getByTestId("bound").textContent).toBe("true");
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
