import { render, screen } from "@testing-library/svelte";
import { getForm } from "../../utils/get-form";
import { user } from "../../utils/user";
import { caseRows, contacts, field } from "./cases";

describe.each(caseRows)("%s required", (_, c) => {
  const renderForm = (props: Record<string, unknown> = {}) =>
    render(c.form, { props: { items: contacts, ...c.formProps, ...props } });

  it("blocks form submission until an item is selected", async () => {
    renderForm({ required: true });

    expect(getForm().checkValidity()).toBe(false);

    await user.click(field());
    await user.click(screen.getByRole("option", { name: "Email" }));

    expect(getForm().checkValidity()).toBe(true);
  });

  it("marks the combobox as required", () => {
    renderForm({ required: true });

    expect(field()).toBeRequired();
  });

  it("is not required by default", () => {
    renderForm();

    expect(field()).not.toBeRequired();
    expect(getForm().checkValidity()).toBe(true);
  });
});
