import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import SliderForm from "./Slider.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
describe("Slider form reset", () => {
  const getInput = (container: HTMLElement) =>
    container.querySelector('input[name="level"]') as HTMLInputElement;

  it("keeps the current value", async () => {
    const { container } = render(SliderForm);
    const input = getInput(container);

    await fireEvent.change(input, { target: { value: "77" } });
    expect(getBound()).toBe("77");

    getForm().reset();
    await flushFormReset();

    expect(input.value).toBe("77");
    expect(getBound()).toBe("77");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "77");
    expect(new FormData(getForm()).get("level")).toBe("77");
  });

  it("keeps a value set by the parent after mount", async () => {
    const { container, rerender } = render(SliderForm);

    await rerender({ value: 55 });
    getForm().reset();
    await flushFormReset();

    expect(getInput(container).value).toBe("55");
    expect(getBound()).toBe("55");
  });

  it("keeps the value with hideTextInput", async () => {
    const { container } = render(SliderForm, {
      props: { hideTextInput: true, value: 30 },
    });

    getForm().reset();
    await flushFormReset();

    expect(getInput(container).value).toBe("30");
    expect(getBound()).toBe("30");
  });
});
