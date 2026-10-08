import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TextInput from "./TextInput.required.test.svelte";

describe("TextInput required", () => {
  it("shows the invalid state instead of the browser bubble", async () => {
    render(TextInput);
    const input = screen.getByRole("textbox");
    let cancelled = false;
    input.addEventListener("invalid", (e) => {
      cancelled = e.defaultPrevented;
    });

    expect(getForm().reportValidity()).toBe(false);
    await tick();

    expect(cancelled).toBe(true);
    expect(screen.getByText("Enter a value")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
  });

  it("clears the state on typing and on form reset", async () => {
    render(TextInput);
    getForm().reportValidity();
    await tick();

    await user.type(screen.getByRole("textbox"), "a");
    expect(screen.queryByText("Enter a value")).toBeNull();

    await user.clear(screen.getByRole("textbox"));
    getForm().reportValidity();
    await tick();
    getForm().reset();
    await flushFormReset();
    expect(screen.queryByText("Enter a value")).toBeNull();
  });

  it("prefers the consumer's own invalid text", async () => {
    render(TextInput, { props: { invalid: true, invalidText: "Taken" } });
    getForm().reportValidity();
    await tick();

    expect(screen.getByText("Taken")).toBeInTheDocument();
    expect(screen.queryByText("Enter a value")).toBeNull();
  });
});
