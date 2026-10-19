import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import TileGroupForm from "./TileGroup.form.test.svelte";

const getRadios = () => screen.getAllByRole("radio");
describe("TileGroup form reset", () => {
  it("unchecks every tile and clears the bound value without firing select", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });

    const [radioA, radioB] = getRadios();
    await user.click(radioB);
    onSelect.mockClear();

    await resetForm();

    expect(radioA).not.toBeChecked();
    expect(radioB).not.toBeChecked();
    expect(getBoundText()).toBe("undefined");
    expect(new FormData(getForm()).has("a")).toBe(false);
    expect(new FormData(getForm()).has("b")).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("follows the tile's default state, as with server-rendered markup", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });

    const [radioA, radioB] = getRadios();
    assert(radioA instanceof HTMLInputElement);
    // Server-rendered markup carries the state as the `checked` attribute.
    radioA.defaultChecked = true;

    await user.click(radioB);
    onSelect.mockClear();

    await resetForm();

    expect(radioA).toBeChecked();
    expect(radioB).not.toBeChecked();
    expect(getBoundText()).toBe("a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("restores a numeric value as the tile's own value", async () => {
    // Numbers are outside the typed `string` contract, but work elsewhere.
    render(TileGroupForm, {
      props: { values: [1, 2] as unknown as string[] },
    });
    const [, radioB] = getRadios();
    assert(radioB instanceof HTMLInputElement);
    radioB.defaultChecked = true;

    await resetForm();

    expect(radioB).toBeChecked();
    expect(radioB.nextElementSibling).toHaveClass("bx--tile--is-selected");
  });

  it("leaves the selection alone when the reset is canceled", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    const [radioA] = getRadios();
    await resetForm();

    expect(radioA).toBeChecked();
    expect(getBoundText()).toBe("a");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
