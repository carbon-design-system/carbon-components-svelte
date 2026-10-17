import { render, screen } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import TextInputForm from "./TextInput.form.test.svelte";

describe("TextInput form reset", () => {
  it("parses a number field", async () => {
    render(TextInputForm, { props: { type: "number", value: 5 } });
    const input = screen.getByRole("spinbutton", {
      name: "User",
    });
    assert(input instanceof HTMLInputElement);
    input.defaultValue = "5";

    await user.type(input, "7");
    expect(getBoundText()).toBe("57");

    await resetForm();

    expect(input).toHaveValue(5);
    expect(getBoundText()).toBe("5");
  });

  it("sets an emptied number field to null", async () => {
    render(TextInputForm, { props: { type: "number" } });
    const input = screen.getByRole("spinbutton", { name: "User" });

    await user.type(input, "7");
    await resetForm();

    expect(getBoundText()).toBe("null");
  });
});
