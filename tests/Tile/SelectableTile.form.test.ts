import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import SelectableTileForm from "./SelectableTile.form.test.svelte";

const getCheckboxes = () =>
  screen.getAllByRole("checkbox") as HTMLInputElement[];

describe("SelectableTile form reset", () => {
  it("clears the group selection and tile styling without firing events", async () => {
    const onEvent = vi.fn();
    render(SelectableTileForm, { props: { selected: ["a"], onEvent } });

    const [boxA, boxB] = getCheckboxes();
    await user.click(boxB);
    expect(getBoundText()).toBe("a,b");
    onEvent.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(boxA).not.toBeChecked();
    expect(boxB).not.toBeChecked();
    expect(getBoundText()).toBe("");
    expect(screen.getByTestId("tile-a")).not.toHaveClass(
      "bx--tile--is-selected",
    );
    expect(screen.getByTestId("tile-b")).not.toHaveClass(
      "bx--tile--is-selected",
    );
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("follows the tile's default state, as with server-rendered markup", async () => {
    render(SelectableTileForm);

    const [boxA, boxB] = getCheckboxes();
    // Server-rendered markup carries the state as the `checked` attribute.
    boxA.defaultChecked = true;
    await user.click(boxB);

    getForm().reset();
    await flushFormReset();

    expect(boxA).toBeChecked();
    expect(boxB).not.toBeChecked();
    expect(getBoundText()).toBe("a");
    expect(screen.getByTestId("tile-a")).toHaveClass("bx--tile--is-selected");
  });

  it("clears a standalone tile without firing deselect", async () => {
    const onEvent = vi.fn();
    render(SelectableTileForm, { props: { onEvent } });

    const solo = getCheckboxes()[2];
    await user.click(solo);
    expect(getBoundText("bound-standalone")).toBe("true");
    onEvent.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(solo).not.toBeChecked();
    expect(getBoundText("bound-standalone")).toBe("false");
    expect(screen.getByTestId("tile-solo")).not.toHaveClass(
      "bx--tile--is-selected",
    );
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("leaves the selection alone when the reset is canceled", async () => {
    render(SelectableTileForm, { props: { selected: ["a"] } });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    getForm().reset();
    await flushFormReset();

    expect(getCheckboxes()[0]).toBeChecked();
    expect(getBoundText()).toBe("a");
  });
});
