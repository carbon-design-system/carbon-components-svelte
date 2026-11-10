import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import UnitInput from "./UnitInput.test.svelte";

const field = () => screen.getByRole("textbox") as HTMLInputElement;
const bound = () => screen.getByTestId("bound").textContent;
const NBSP = String.fromCodePoint(0xa0);

describe("UnitInput", () => {
  it("writes the unit after the number and binds a number", async () => {
    render(UnitInput);
    await user.type(field(), "12.5");

    expect(field()).toHaveValue("12.5 kg");
    expect(bound()).toBe("12.5");
  });

  it("keeps the caret before the unit while typing", async () => {
    render(UnitInput);
    await user.type(field(), "1234");

    expect(field()).toHaveValue("1,234 kg");
    expect(field().selectionStart).toBe(5);
  });

  it.each([
    ["%", "5", "5%"],
    ["ms", "1500", "1,500 ms"],
    ["GB", "1500", "1,500 GB"],
  ])("takes the symbol %s", async (unit, keys, expected) => {
    render(UnitInput, { props: { props: { unit } } });
    await user.type(field(), keys);

    expect(field()).toHaveValue(expected);
  });

  it("writes the unit where the locale does", async () => {
    render(UnitInput, { props: { props: { unit: "%", locale: "de-DE" } } });
    await user.type(field(), "12,5");

    expect(field()).toHaveValue(`12,5${NBSP}%`);
    expect(bound()).toBe("12.5");
  });

  it("is null when empty and follows a value set from outside", async () => {
    render(UnitInput);
    expect(bound()).toBe("null");
    await user.click(screen.getByText("Set"));

    expect(field()).toHaveValue("7.25 kg");
  });

  it("takes a minus for a temperature", async () => {
    render(UnitInput, { props: { props: { unit: "°C", min: -40 } } });
    await user.type(field(), "-12");

    expect(field()).toHaveValue("-12°C");
    expect(bound()).toBe("-12");
  });

  it("marks a number outside min and max invalid", async () => {
    render(UnitInput, { props: { props: { min: 0, max: 100 } } });
    await user.type(field(), "101");
    await tick();

    expect(field()).toHaveAttribute("aria-invalid", "true");
  });

  it("names the unit for assistive technology", () => {
    render(UnitInput);

    const hint = screen.getByText("Value in kilograms");
    expect(field().getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("submits the number under its name", async () => {
    render(UnitInput, { props: { props: { name: "weight" } } });
    await user.type(field(), "12.5");

    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("weight")).toBe("12.5");
  });
});
