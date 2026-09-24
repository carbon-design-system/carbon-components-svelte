import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import RadioButtonGroupForm from "./RadioButtonGroup.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
/** The reset sync runs on the next task. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("RadioButtonGroup form reset", () => {
  it("unchecks every radio and clears the bound value without firing change", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, { props: { selected: "a", onChange } });

    await user.click(screen.getByRole("radio", { name: "B" }));
    onChange.mockClear();

    getForm().reset();
    await flush();

    expect(screen.getByRole("radio", { name: "A" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(new FormData(getForm()).has("a")).toBe(false);
    expect(new FormData(getForm()).has("b")).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("unchecks the initially selected radio on reset even without prior interaction", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, { props: { selected: "a", onChange } });

    expect(screen.getByTestId("bound").textContent).toBe("a");

    getForm().reset();
    await flush();

    expect(screen.getByRole("radio", { name: "A" })).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("follows the radio's default state, as with server-rendered markup", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, { props: { selected: "a", onChange } });
    const radioA = screen.getByRole("radio", { name: "A" }) as HTMLInputElement;
    // Server-rendered markup carries the state as the `checked` attribute.
    radioA.defaultChecked = true;

    await user.click(screen.getByRole("radio", { name: "B" }));
    onChange.mockClear();

    getForm().reset();
    await flush();

    expect(radioA).toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("a");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the bound value when nothing was selected before the reset", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, { props: { onChange } });

    await user.click(screen.getByRole("radio", { name: "B" }));
    onChange.mockClear();

    getForm().reset();
    await flush();

    expect(screen.getByRole("radio", { name: "A" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("leaves the selection alone when the reset is canceled", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, { props: { selected: "a", onChange } });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    getForm().reset();
    await flush();

    expect(screen.getByRole("radio", { name: "A" })).toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("a");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps a read-only group's selection", async () => {
    const onChange = vi.fn();
    render(RadioButtonGroupForm, {
      props: { selected: "a", readonly: true, onChange },
    });

    getForm().reset();
    await flush();

    expect(screen.getByRole("radio", { name: "A" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("a");
    expect(onChange).not.toHaveBeenCalled();
  });
});
