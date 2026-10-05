import { render } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import StructuredListForm from "./StructuredList.form.test.svelte";

const getInputs = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>(
      "input.bx--structured-list-input",
    ),
  );

describe("StructuredList form reset", () => {
  it("clears a single selection without firing change", async () => {
    const onChange = vi.fn();
    render(StructuredListForm, { props: { onChange } });

    await user.click(getInputs()[1]);
    expect(getBoundText()).toBe('"mongodb"');
    onChange.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("undefined");
    for (const input of getInputs()) expect(input).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    // The next user selection still reports `change`.
    await user.click(getInputs()[2]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("clears a multiple selection", async () => {
    const onChange = vi.fn();
    render(StructuredListForm, {
      props: { multiple: true, selected: ["postgresql", "redis"], onChange },
    });
    expect(getInputs()[0]).toBeChecked();

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("[]");
    expect(new FormData(getForm()).getAll("engine")).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("follows the row's default state, as with server-rendered markup", async () => {
    render(StructuredListForm);

    // Server-rendered markup carries the state as the `checked` attribute.
    getInputs()[0].defaultChecked = true;
    await user.click(getInputs()[2]);

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe('"postgresql"');
    expect(getInputs()[0]).toBeChecked();
  });
});
