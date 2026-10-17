import { fireEvent, render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import SliderForm from "./Slider.form.test.svelte";

describe("Slider form reset", () => {
  const getInput = (container: HTMLElement) => {
    const input = container.querySelector<HTMLInputElement>(
      'input[name="level"]',
    );
    assert(input);
    return input;
  };

  it("keeps the current value", async () => {
    const { container } = render(SliderForm);
    const input = getInput(container);

    await fireEvent.change(input, { target: { value: "77" } });
    expect(getBoundText()).toBe("77");

    await resetForm();

    expect(input.value).toBe("77");
    expect(getBoundText()).toBe("77");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "77");
    expect(new FormData(getForm()).get("level")).toBe("77");
  });

  it("keeps a value set by the parent after mount", async () => {
    const { container, rerender } = render(SliderForm);

    await rerender({ value: 55 });
    await resetForm();

    expect(getInput(container).value).toBe("55");
    expect(getBoundText()).toBe("55");
  });

  it("keeps the value with hideTextInput", async () => {
    const { container } = render(SliderForm, {
      props: { hideTextInput: true, value: 30 },
    });

    await resetForm();

    expect(getInput(container).value).toBe("30");
    expect(getBoundText()).toBe("30");
  });

  it("submits and keeps the value when read-only", async () => {
    const { container, rerender } = render(SliderForm, {
      props: { readonly: true, value: 30 },
    });

    expect(new FormData(getForm()).get("level")).toBe("30");

    await rerender({ readonly: true, value: 55 });
    await resetForm();

    expect(getInput(container).value).toBe("55");
    expect(getBoundText()).toBe("55");
    expect(new FormData(getForm()).get("level")).toBe("55");
  });
});
