import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import ComboBoxForm from "./ComboBox.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const getInput = () =>
  screen.getByRole("combobox", { name: "Fruit" }) as HTMLInputElement;

describe("ComboBox form reset", () => {
  it("clears the selection with the input, without a select event", async () => {
    const onSelect = vi.fn();
    render(ComboBoxForm, { props: { onSelect } });

    await user.click(getInput());
    await user.click(screen.getByText("Banana"));
    expect(getBound()).toBe("banana|Banana");
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("");
    expect(getBound()).toBe("none|");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects the item matching the default value, as with server-rendered markup", async () => {
    const onSelect = vi.fn();
    render(ComboBoxForm, {
      props: { selectedId: "apple", value: "Apple", onSelect },
    });
    // Server-rendered markup carries the label as the `value` attribute.
    getInput().defaultValue = "apple";

    await user.click(getInput());
    await user.click(screen.getByText("Banana"));
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("Apple");
    expect(getBound()).toBe("apple|Apple");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps unmatched text only with allowCustomValue", async () => {
    render(ComboBoxForm, { props: { allowCustomValue: true } });
    getInput().defaultValue = "Cherry";

    getForm().reset();
    await flushFormReset();

    expect(getBound()).toBe("none|Cherry");
  });

  it("drops unmatched text without allowCustomValue", async () => {
    render(ComboBoxForm);
    getInput().defaultValue = "Cherry";

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("");
    expect(getBound()).toBe("none|");
  });

  it("keeps a read-only combobox as it was", async () => {
    render(ComboBoxForm, {
      props: { selectedId: "banana", value: "Banana", readonly: true },
    });

    getForm().reset();
    await flushFormReset();

    expect(getInput()).toHaveValue("Banana");
    expect(getBound()).toBe("banana|Banana");
  });
});
