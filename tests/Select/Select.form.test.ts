import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import SelectForm from "./Select.form.test.svelte";

describe("Select form reset", () => {
  it("keeps the current choice and the bound value in step", async () => {
    const onUpdate = vi.fn();
    render(SelectForm, { props: { selected: "m", onUpdate } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "l");
    onUpdate.mockClear();

    await resetForm();

    expect(select).toHaveValue("l");
    expect(getBoundText()).toBe("l");
    expect(new FormData(getForm()).get("size")).toBe("l");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("binds the first item's value on mount without firing update", async () => {
    const onUpdate = vi.fn();
    render(SelectForm, { props: { onUpdate } });
    await tick();

    expect(getBoundText()).toBe("s");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("does not fire update when the parent sets selected", async () => {
    const onUpdate = vi.fn();
    const { rerender } = render(SelectForm, { props: { onUpdate } });

    await rerender({ selected: "l" });
    await tick();

    expect(getBoundText()).toBe("l");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("keeps a value set by the parent after mount", async () => {
    const { rerender } = render(SelectForm);
    const select = screen.getByRole("combobox", { name: "Size" });

    await rerender({ selected: "l" });
    await tick();
    await resetForm();

    expect(select).toHaveValue("l");
    expect(getBoundText()).toBe("l");
  });

  it("keeps a numeric choice", async () => {
    render(SelectForm, { props: { numeric: true, selected: 0 } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "2");
    await resetForm();

    expect(select).toHaveValue("2");
    expect(getBoundText()).toBe("2");
  });

  it("keeps the inline variant's choice", async () => {
    render(SelectForm, { props: { inline: true, selected: "m" } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "s");
    await resetForm();

    expect(select).toHaveValue("s");
    expect(getBoundText()).toBe("s");
  });

  it("marks only the current choice with the selected attribute", async () => {
    render(SelectForm, { props: { selected: "m" } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "l");
    await tick();

    const marked = screen
      .getAllByRole("option")
      .filter((option) => option.hasAttribute("selected"))
      .map((option) => {
        assert(option instanceof HTMLOptionElement);
        return option.value;
      });
    expect(marked).toEqual(["l"]);
  });
});
