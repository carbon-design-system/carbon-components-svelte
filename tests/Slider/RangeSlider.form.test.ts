import { fireEvent, render } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
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

    getForm().reset();
    await flushFormReset();

    expect(lower.value).toBe("30");
    expect(upper.value).toBe("70");
    expect(getBoundText()).toBe("30-70");
    const data = new FormData(getForm());
    expect([data.get("low"), data.get("high")]).toEqual(["30", "70"]);
  });

  it("keeps bounds set by the parent after mount", async () => {
    const { container, rerender } = render(RangeSliderForm);

    await rerender({ value: 25, valueUpper: 75 });
    getForm().reset();
    await flushFormReset();

    const lower =
      container.querySelector<HTMLInputElement>('input[name="low"]');
    assert(lower);
    expect(lower.value).toBe("25");
    expect(getBoundText()).toBe("25-75");
  });
});
