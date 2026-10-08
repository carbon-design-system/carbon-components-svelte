import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import Dropdown from "./Dropdown.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax", disabled: true },
];

describe("Dropdown required", () => {
  it("blocks form submission until an item is selected", async () => {
    render(Dropdown, { props: { items, required: true } });

    expect(getForm().checkValidity()).toBe(false);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(getForm().checkValidity()).toBe(true);
  });

  it("treats a disabled selection as missing", () => {
    render(Dropdown, { props: { items, selectedId: "2", required: true } });

    expect(getForm().checkValidity()).toBe(false);
  });

  it("marks the combobox as required", () => {
    render(Dropdown, { props: { items, required: true } });

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("does not validate when not required or disabled", async () => {
    const { rerender } = render(Dropdown, { props: { items } });
    expect(getForm().checkValidity()).toBe(true);
    expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-required");

    await rerender({ required: true, disabled: true });
    expect(getForm().checkValidity()).toBe(true);
  });
});
