import { render, screen, within } from "@testing-library/svelte";
import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import type { FieldConfig } from "carbon-components-svelte/SchemaForm/create-form.js";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import AllFields from "./AllFields.test.svelte";

const fields: FieldConfig[] = [
  { name: "name", label: "Name", required: true },
  {
    name: "address",
    type: "object",
    label: "Address",
    fields: [
      { name: "city", label: "City", required: true },
      { name: "zip", label: "ZIP" },
    ],
  },
  {
    name: "servers",
    type: "array",
    label: "Servers",
    minItems: 1,
    maxItems: 3,
    items: {
      fields: [{ name: "host", label: "Host", required: true }],
    },
  },
  { name: "billing", type: "toggle", label: "Bill separately" },
  {
    name: "po",
    label: "PO number",
    visibleIf: { field: "billing", equals: true },
  },
];

const renderForm = (initialValues = {}, props = {}) => {
  const form = createForm({ fields, initialValues });
  const result = render(AllFields, { form, ...props });
  return { form, ...result, el: screen.getByTestId("form") as HTMLFormElement };
};

describe("SchemaForm", () => {
  it("renders an object as a fieldset with a legend", () => {
    renderForm();
    const group = screen.getByRole("group", { name: "Address" });
    expect(group.tagName).toBe("FIELDSET");
    expect(within(group).getByLabelText("City")).toBeInTheDocument();
  });

  it("names controls the way a native form posts them", () => {
    const { el } = renderForm({ servers: [{ host: "a" }, { host: "b" }] });
    const names = [...el.querySelectorAll("input[name]")].map((i) =>
      i.getAttribute("name"),
    );
    expect(names).toEqual(
      expect.arrayContaining([
        "name",
        "address.city",
        "address.zip",
        "servers[0].host",
        "servers[1].host",
      ]),
    );
    const data = new FormData(el);
    expect(data.get("servers[1].host")).toBe("b");
  });

  it("shows and hides a conditional field", async () => {
    renderForm();
    expect(screen.queryByLabelText("PO number")).not.toBeInTheDocument();
    await user.click(screen.getByRole("switch"));
    expect(screen.getByLabelText("PO number")).toBeInTheDocument();
  });

  describe("arrays", () => {
    it("starts with minItems rows and stops adding at maxItems", async () => {
      renderForm();
      expect(screen.getAllByLabelText("Host")).toHaveLength(1);
      const add = screen.getByRole("button", { name: "Add item" });
      await user.click(add);
      await user.click(add);
      expect(screen.getAllByLabelText("Host")).toHaveLength(3);
      expect(add).toBeDisabled();
    });

    it("moves focus to the new row's first control after adding", async () => {
      renderForm();
      await user.click(screen.getByRole("button", { name: "Add item" }));
      await tick();
      expect(screen.getAllByLabelText("Host")[1]).toHaveFocus();
    });

    it("reorders rows with the buttons and keeps focus on the moved row", async () => {
      const { form } = renderForm({
        servers: [{ host: "a" }, { host: "b" }],
      });
      await user.click(
        screen.getByRole("button", { name: "Move down (Item 1)" }),
      );
      await tick();
      expect(form.getRawValues().servers).toEqual([
        { host: "b" },
        { host: "a" },
      ]);
      const hosts = screen.getAllByLabelText("Host") as HTMLInputElement[];
      expect(hosts.map((h) => h.value)).toEqual(["b", "a"]);
      expect(
        screen.getByRole("button", { name: "Move down (Item 2)" }),
      ).toBeDisabled();
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Move up (Item 2)" }),
      );
    });

    it("removes a row and announces it", async () => {
      const { form } = renderForm({
        servers: [{ host: "a" }, { host: "b" }],
      });
      await user.click(screen.getByRole("button", { name: "Remove Item 1" }));
      expect(form.getRawValues().servers).toEqual([{ host: "b" }]);
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(screen.getByRole("status")).toHaveTextContent("Item 1 removed");
    });
  });

  describe("submit", () => {
    it("shows an error summary and focuses it", async () => {
      const onInvalid = vi.fn();
      const { form } = renderForm({}, { oninvalid: onInvalid });
      await user.click(screen.getByRole("button", { name: "Submit" }));
      await tick();
      const summary = screen.getByRole("group", { name: /problems/ });
      expect(summary).toHaveFocus();
      const links = within(summary).getAllByRole("link");
      expect(links.map((l) => l.textContent)).toEqual([
        "Name is required",
        "City is required",
        "Host is required",
      ]);
      expect(onInvalid).toHaveBeenCalled();
      expect(form.getErrors()).toHaveProperty("name");
    });

    it("moves focus from a summary link to the field", async () => {
      renderForm();
      await user.click(screen.getByRole("button", { name: "Submit" }));
      await tick();
      await user.click(screen.getByRole("link", { name: "City is required" }));
      expect(screen.getByLabelText("City")).toHaveFocus();
    });

    it("wires the field to its error for assistive tech", async () => {
      renderForm();
      await user.click(screen.getByRole("button", { name: "Submit" }));
      const name = screen.getByLabelText("Name");
      expect(name).toBeInvalid();
      expect(name.getAttribute("aria-errormessage")).toBeTruthy();
      expect(
        document.getElementById(name.getAttribute("aria-errormessage") ?? ""),
      ).toHaveTextContent("Name is required");
    });

    it("dispatches the values once the form is valid", async () => {
      const onSubmit = vi.fn();
      renderForm(
        { name: "web", address: { city: "Oslo" }, servers: [{ host: "h1" }] },
        { onsubmit: onSubmit },
      );
      await user.click(screen.getByRole("button", { name: "Submit" }));
      await flushMacrotask();
      expect(onSubmit).toHaveBeenCalledWith({
        name: "web",
        address: { city: "Oslo", zip: "" },
        servers: [{ host: "h1" }],
        billing: false,
      });
      expect(screen.queryByRole("group", { name: /problem/ })).toBeNull();
    });
  });

  it("resets to the starting values from a native reset button", async () => {
    const { form } = renderForm({ name: "web" });
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "other");
    expect(form.getRawValues().name).toBe("other");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await flushMacrotask();
    await flushMacrotask();
    expect(form.getRawValues().name).toBe("web");
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "web",
    );
  });
});
