import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TileGroupForm from "./TileGroup.form.test.svelte";

const getRadios = () => screen.getAllByRole("radio") as HTMLInputElement[];
describe("TileGroup form reset", () => {
  it("unchecks every tile and clears the bound value without firing select", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });

    const [radioA, radioB] = getRadios();
    await user.click(radioB);
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(radioA).not.toBeChecked();
    expect(radioB).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(new FormData(getForm()).has("a")).toBe(false);
    expect(new FormData(getForm()).has("b")).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("unchecks the initially selected tile on reset even without prior interaction", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });

    const [radioA] = getRadios();
    expect(screen.getByTestId("bound").textContent).toBe("a");

    getForm().reset();
    await flushFormReset();

    expect(radioA).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("follows the tile's default state, as with server-rendered markup", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });

    const [radioA, radioB] = getRadios();
    // Server-rendered markup carries the state as the `checked` attribute.
    radioA.defaultChecked = true;

    await user.click(radioB);
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(radioA).toBeChecked();
    expect(radioB).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears the bound value when nothing was selected before the reset", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { onSelect } });

    const [radioA, radioB] = getRadios();
    await user.click(radioB);
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(radioA).not.toBeChecked();
    expect(radioB).not.toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("undefined");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("leaves the selection alone when the reset is canceled", async () => {
    const onSelect = vi.fn();
    render(TileGroupForm, { props: { selected: "a", onSelect } });
    getForm().addEventListener("reset", (event) => event.preventDefault());

    const [radioA] = getRadios();
    getForm().reset();
    await flushFormReset();

    expect(radioA).toBeChecked();
    expect(screen.getByTestId("bound").textContent).toBe("a");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
