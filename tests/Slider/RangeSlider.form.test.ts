import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import RangeSliderForm from "./RangeSlider.form.test.svelte";

const getBound = () => screen.getByTestId("bound").textContent;
describe("RangeSlider form reset", () => {
  it("keeps both current bounds", async () => {
    const { container } = render(RangeSliderForm);
    const lower = container.querySelector(
      'input[name="low"]',
    ) as HTMLInputElement;
    const upper = container.querySelector(
      'input[name="high"]',
    ) as HTMLInputElement;

    await fireEvent.change(lower, { target: { value: "30" } });
    await fireEvent.change(upper, { target: { value: "70" } });
    expect(getBound()).toBe("30-70");

    getForm().reset();
    await flushFormReset();

    expect(lower.value).toBe("30");
    expect(upper.value).toBe("70");
    expect(getBound()).toBe("30-70");
    const data = new FormData(getForm());
    expect([data.get("low"), data.get("high")]).toEqual(["30", "70"]);
  });

  it("keeps bounds set by the parent after mount", async () => {
    const { container, rerender } = render(RangeSliderForm);

    await rerender({ value: 25, valueUpper: 75 });
    getForm().reset();
    await flushFormReset();

    expect(
      (container.querySelector('input[name="low"]') as HTMLInputElement).value,
    ).toBe("25");
    expect(getBound()).toBe("25-75");
  });
});
