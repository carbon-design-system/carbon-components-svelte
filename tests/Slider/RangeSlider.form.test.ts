import { fireEvent, render } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import RangeSliderForm from "./RangeSlider.form.test.svelte";

describe("RangeSlider form reset", () => {
  it("keeps both current bounds", async () => {
    const { container } = render(RangeSliderForm);
    const lower =
      container.querySelector<HTMLInputElement>('input[name="low"]');
    assert(lower);
    const upper =
      container.querySelector<HTMLInputElement>('input[name="high"]');
    assert(upper);

    await fireEvent.change(lower, { target: { value: "30" } });
    await fireEvent.change(upper, { target: { value: "70" } });
    expect(getBoundText()).toBe("30-70");

    await resetForm();

    expect(lower.value).toBe("30");
    expect(upper.value).toBe("70");
    expect(getBoundText()).toBe("30-70");
    const data = new FormData(getForm());
    expect([data.get("low"), data.get("high")]).toEqual(["30", "70"]);
  });

  it("keeps bounds set by the parent after mount", async () => {
    const { container, rerender } = render(RangeSliderForm);

    await rerender({ value: 25, valueUpper: 75 });
    await resetForm();

    const lower =
      container.querySelector<HTMLInputElement>('input[name="low"]');
    assert(lower);
    expect(lower.value).toBe("25");
    expect(getBoundText()).toBe("25-75");
  });

  it("submits and keeps both bounds when read-only", async () => {
    const { container, rerender } = render(RangeSliderForm, {
      props: { readonly: true, value: 30, valueUpper: 70 },
    });
    const data = () => {
      const formData = new FormData(getForm());
      return [formData.get("low"), formData.get("high")];
    };

    expect(data()).toEqual(["30", "70"]);

    await rerender({ readonly: true, value: 25, valueUpper: 75 });
    await resetForm();

    const lower =
      container.querySelector<HTMLInputElement>('input[name="low"]');
    assert(lower);
    expect(lower.value).toBe("25");
    expect(getBoundText()).toBe("25-75");
    expect(data()).toEqual(["25", "75"]);
  });
});
