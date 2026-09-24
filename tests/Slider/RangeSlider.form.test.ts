import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import RangeSliderForm from "./RangeSlider.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getFields = () =>
  screen.getAllByRole("spinbutton") as [HTMLInputElement, HTMLInputElement];

describe("RangeSlider form reset", () => {
  it("follows both fields' default values without a change event", async () => {
    const onChange = vi.fn();
    render(RangeSliderForm, { props: { value: 30, valueUpper: 60, onChange } });
    const [lower, upper] = getFields();
    // Server-rendered markup carries the values as `value` attributes.
    lower.defaultValue = "10";
    upper.defaultValue = "90";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("10-90");
    expect(lower).toHaveValue(10);
    expect(upper).toHaveValue(90);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps the upper bound against the reset lower bound", async () => {
    render(RangeSliderForm, { props: { value: 30, valueUpper: 60 } });
    const [lower, upper] = getFields();
    lower.defaultValue = "80";
    upper.defaultValue = "50";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("80-80");
  });

  it("keeps the values of fields with no default value", async () => {
    render(RangeSliderForm, { props: { value: 30, valueUpper: 60 } });
    const [lower, upper] = getFields();
    upper.defaultValue = "0";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("30-30");
    expect(lower).toHaveValue(30);
    expect(upper).toHaveValue(30);
  });

  it("keeps a read-only slider as it was", async () => {
    render(RangeSliderForm, {
      props: { value: 30, valueUpper: 60, readonly: true },
    });
    const [lower, upper] = getFields();
    lower.defaultValue = "10";
    upper.defaultValue = "90";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("30-60");
    expect(lower).toHaveValue(30);
    expect(upper).toHaveValue(60);
  });
});
