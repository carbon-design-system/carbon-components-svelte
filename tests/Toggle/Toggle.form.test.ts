import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import ToggleForm from "./Toggle.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;

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
    it("syncs the bound state to the reset switch without a toggle event", async () => {
      const onToggle = vi.fn();
      render(ToggleForm, { props: { onToggle } });
      const toggle = screen.getByRole("switch");

      await user.click(toggle);
      expect(getBound()).toBe("true");
      onToggle.mockClear();

      getForm().reset();
      await flushFormReset();

      expect(toggle).not.toBeChecked();
      expect(getBound()).toBe("false");
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("follows the switch's default state, as with server-rendered markup", async () => {
      render(ToggleForm, { props: { toggled: true } });
      const toggle = screen.getByRole("switch") as HTMLInputElement;
      // Server-rendered markup carries the state as the `checked` attribute.
      toggle.defaultChecked = true;

      await user.click(toggle);
      expect(getBound()).toBe("false");

      getForm().reset();
      await flushFormReset();

      expect(toggle).toBeChecked();
      expect(getBound()).toBe("true");
    });

    it("keeps a read-only switch as it was", async () => {
      render(ToggleForm, { props: { toggled: true, readonly: true } });
      const toggle = screen.getByRole("switch");

      getForm().reset();
      await flushFormReset();

      expect(toggle).toBeChecked();
      expect(getBound()).toBe("true");
    });
  });
});
