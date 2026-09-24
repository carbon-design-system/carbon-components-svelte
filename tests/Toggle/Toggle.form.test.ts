import { render, screen } from "@testing-library/svelte";
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
});
