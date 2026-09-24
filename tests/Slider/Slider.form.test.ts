import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import SliderForm from "./Slider.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getField = () => screen.getByRole("spinbutton") as HTMLInputElement;

describe("Slider form reset", () => {
  it("follows the field's default value without a change event", async () => {
    const onChange = vi.fn();
    render(SliderForm, { props: { value: 20, onChange } });
    const field = getField();
    // Server-rendered markup carries the value as the `value` attribute.
    field.defaultValue = "20";

    await user.clear(field);
    await user.type(field, "70");
    await user.tab();
    expect(getBound()).toBe("70");
    onChange.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(20);
    expect(getBound()).toBe("20");
    expect(new FormData(getForm()).get("volume")).toBe("20");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps a default value outside the range", async () => {
    render(SliderForm, { props: { value: 20 } });
    const field = getField();
    field.defaultValue = "500";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("100");
  });

  it("puts the field back when it has no default value", async () => {
    render(SliderForm, { props: { value: 20 } });
    const field = getField();

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(20);
    expect(getBound()).toBe("20");
  });

  it("keeps a read-only slider as it was", async () => {
    render(SliderForm, { props: { value: 20, readonly: true } });
    const field = getField();
    field.defaultValue = "50";

    getForm().reset();
    await flushFormReset();

    expect(field).toHaveValue(20);
    expect(getBound()).toBe("20");
  });

  it("keeps 0 as a value", async () => {
    render(SliderForm, { props: { value: 20 } });
    const field = getField();
    field.defaultValue = "0";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("0");
  });
});
