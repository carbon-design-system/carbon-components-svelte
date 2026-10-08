import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
];

describe("ComboBox required", () => {
  it("blocks form submission until an item is selected", async () => {
    render(ComboBox, { props: { items, required: true } });

    expect(getForm().checkValidity()).toBe(false);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(getForm().checkValidity()).toBe(true);
  });

  it("marks the combobox as required", () => {
    render(ComboBox, { props: { items, required: true } });

    expect(screen.getByRole("combobox")).toBeRequired();
  });

  it("is not required by default", () => {
    render(ComboBox, { props: { items } });

    expect(screen.getByRole("combobox")).not.toBeRequired();
    expect(getForm().checkValidity()).toBe(true);
  });
});
