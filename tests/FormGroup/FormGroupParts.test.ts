import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import FormGroupParts from "./FormGroupParts.test.svelte";

describe("FormGroup with form parts", () => {
  it("describes the fieldset with helper text placed in the group", () => {
    render(FormGroupParts);

    expect(screen.getByText("Pick at least one")).toHaveAttribute(
      "id",
      "helper-contact",
    );
    expect(
      screen.getByRole("group", { name: "Contact" }),
    ).toHaveAccessibleDescription("Pick at least one");
  });

  it("puts a mounted message first, after the group's own message", async () => {
    const { component } = render(FormGroupParts, {
      props: { message: true },
    });

    component.error = "Pick a contact method";
    await tick();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Pick a contact method",
    );
    expect(
      screen.getByRole("group", { name: "Contact" }),
    ).toHaveAccessibleDescription(
      "Group note Pick a contact method Pick at least one",
    );

    component.error = "";
    await tick();

    expect(
      screen.getByRole("group", { name: "Contact" }),
    ).toHaveAccessibleDescription("Group note Pick at least one");
  });

  it("leaves a nested FormItem's helper text on its own control", () => {
    render(FormGroupParts);

    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription(
      "Mobile only",
    );
    expect(
      screen.getByRole("group", { name: "Contact" }),
    ).not.toHaveAccessibleDescription(/Mobile only/);
  });

  it("doesn't point a label in the group at the fieldset", () => {
    render(FormGroupParts);

    const label = screen.getByText("Loose label");
    expect(label).not.toHaveAttribute("for", "contact");
    expect(label).not.toHaveAttribute("id");
  });

  it("styles helper text in a disabled group as disabled", () => {
    render(FormGroupParts, { props: { disabled: true } });

    expect(screen.getByText("Pick at least one")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("restyles helper text when the group's disabled changes", async () => {
    const { component } = render(FormGroupParts);
    const helper = screen.getByText("Pick at least one");
    expect(helper).not.toHaveClass("bx--form__helper-text--disabled");

    component.disabled = true;
    await tick();

    expect(helper).toHaveClass("bx--form__helper-text--disabled");
  });

  it("moves the helper text id when the group id changes", async () => {
    const { component } = render(FormGroupParts);

    component.id = "reach";
    await tick();

    expect(screen.getByText("Pick at least one")).toHaveAttribute(
      "id",
      "helper-reach",
    );
    expect(
      screen.getByRole("group", { name: "Contact" }),
    ).toHaveAccessibleDescription("Pick at least one");
  });
});
