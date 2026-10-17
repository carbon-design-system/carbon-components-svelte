import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import Dropdown from "./Dropdown.form.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax", disabled: true },
];

/** Shared `required` behavior is in tests/ListBox/family/required.test.ts. */
describe("Dropdown required", () => {
  it("treats a disabled selection as missing", () => {
    render(Dropdown, { props: { items, selectedId: "2", required: true } });

    expect(getForm().checkValidity()).toBe(false);
  });

  it("does not validate when disabled", () => {
    render(Dropdown, { props: { items, required: true, disabled: true } });

    expect(getForm().checkValidity()).toBe(true);
  });
});
