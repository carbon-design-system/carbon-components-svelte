import { render, screen } from "@testing-library/svelte";
import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import { tick } from "svelte";
import { get } from "svelte/store";
import { user } from "../utils/user";
import AllFields from "./AllFields.test.svelte";
import SwatchWidget from "./SwatchWidget.test.svelte";

describe("SchemaForm widgets prop", () => {
  const setup = (extra = {}) => {
    const form = createForm({
      fields: [
        {
          name: "color",
          type: "swatch",
          label: "Colour",
          required: true,
          options: ["red", "blue"],
        },
        { name: "title", label: "Title" },
      ],
      ...extra,
    });
    render(AllFields, { form, widgets: { swatch: SwatchWidget } });
    return form;
  };

  it("renders a field of a type the registry adds", () => {
    setup();
    expect(screen.getByRole("group", { name: "Colour" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("takes the value a custom widget reports", async () => {
    const form = setup();
    await user.click(screen.getByLabelText("blue"));
    expect(form.getRawValues().color).toBe("blue");
    form.setValue("color", "red");
    await tick();
    expect(screen.getByLabelText<HTMLInputElement>("red").checked).toBe(true);
  });

  it("gives a custom widget the error and the native name", async () => {
    const form = setup();
    await form.submit();
    await tick();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(
      "Colour is required",
    );
    expect(screen.getByLabelText("red")).toHaveAttribute("name", "color");
  });

  it("checks the blur of a custom widget when focus leaves it", async () => {
    const form = setup();
    await user.click(screen.getByLabelText("red"));
    await user.click(screen.getByLabelText("Title"));
    expect(get(form.field("color")).touched).toBe(true);
  });
});
