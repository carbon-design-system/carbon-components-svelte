import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import SelectForm from "./Select.form.test.svelte";

const getForm = () => screen.getByTestId("form") as HTMLFormElement;
const getBound = () => screen.getByTestId("bound").textContent;
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  await tick();
};

describe("Select form reset", () => {
  it("keeps the current choice and the bound value in step", async () => {
    const onUpdate = vi.fn();
    render(SelectForm, { props: { selected: "m", onUpdate } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "l");
    onUpdate.mockClear();

    getForm().reset();
    await flush();

    expect(select).toHaveValue("l");
    expect(getBound()).toBe("l");
    expect(new FormData(getForm()).get("size")).toBe("l");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("keeps a value set by the parent after mount", async () => {
    const { rerender } = render(SelectForm);
    const select = screen.getByRole("combobox", { name: "Size" });

    await rerender({ selected: "l" });
    await tick();
    getForm().reset();
    await flush();

    expect(select).toHaveValue("l");
    expect(getBound()).toBe("l");
  });

  it("keeps a numeric choice", async () => {
    render(SelectForm, { props: { numeric: true, selected: 0 } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "2");
    getForm().reset();
    await flush();

    expect(select).toHaveValue("2");
    expect(getBound()).toBe("2");
  });

  it("keeps the inline variant's choice", async () => {
    render(SelectForm, { props: { inline: true, selected: "m" } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "s");
    getForm().reset();
    await flush();

    expect(select).toHaveValue("s");
    expect(getBound()).toBe("s");
  });

  it("marks only the current choice with the selected attribute", async () => {
    render(SelectForm, { props: { selected: "m" } });
    const select = screen.getByRole("combobox", { name: "Size" });

    await user.selectOptions(select, "l");
    await tick();

    const marked = screen
      .getAllByRole("option")
      .filter((option) => option.hasAttribute("selected"))
      .map((option) => (option as HTMLOptionElement).value);
    expect(marked).toEqual(["l"]);
  });
});
