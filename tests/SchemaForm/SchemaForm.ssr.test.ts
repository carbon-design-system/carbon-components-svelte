// @vitest-environment node
import { createForm } from "../../src/SchemaForm/create-form.js";
import { renderSSR } from "../utils/ssr";
import AllFields from "./AllFields.test.svelte";

const options = ["a", "b", "c"];

describe("SchemaForm server render", () => {
  it("renders every field type with its initial value", () => {
    const form = createForm({
      fields: [
        { name: "text", label: "Text" },
        { name: "area", type: "textarea", label: "Area" },
        { name: "num", type: "number", label: "Num" },
        { name: "pick", type: "select", label: "Pick", options },
        { name: "drop", type: "dropdown", label: "Drop", options },
        { name: "combo", type: "combobox", label: "Combo", options },
        { name: "multi", type: "multiselect", label: "Multi", options },
        { name: "agree", type: "checkbox", label: "Agree" },
        { name: "on", type: "toggle", label: "On" },
        { name: "radio", type: "radio", label: "Radio", options },
        { name: "boxes", type: "checkboxes", label: "Boxes", options },
        { name: "btns", type: "togglebuttons", label: "Btns", options },
        { name: "day", type: "date", label: "Day" },
        { name: "span", type: "daterange", label: "Span" },
        { name: "at", type: "time", label: "At" },
        { name: "level", type: "slider", label: "Level" },
        { name: "band", type: "rangeslider", label: "Band" },
        { name: "tags", type: "tags", label: "Tags" },
        { name: "pin", type: "pin", label: "Pin" },
        { name: "stars", type: "rating", label: "Stars" },
        { name: "file", type: "file", label: "File" },
        { name: "pw", type: "password", label: "Pw" },
        { name: "find", type: "search", label: "Find" },
        {
          name: "address",
          type: "object",
          label: "Address",
          fields: [{ name: "city", label: "City" }],
        },
        {
          name: "rows",
          type: "array",
          label: "Rows",
          items: { fields: [{ name: "host", label: "Host" }] },
        },
      ],
      initialValues: {
        text: "from the server",
        num: 7,
        pick: "b",
        radio: "c",
        agree: true,
        boxes: ["a"],
        day: "2026-03-04",
        address: { city: "Oslo" },
        rows: [{ host: "h1" }, { host: "h2" }],
      },
    });
    const { document } = renderSSR(AllFields, { form });

    const value = (name: string) =>
      document.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value;
    expect(value("text")).toBe("from the server");
    expect(value("address.city")).toBe("Oslo");
    expect(value("rows[0].host")).toBe("h1");
    expect(value("rows[1].host")).toBe("h2");
    expect(value("day")).toBe("2026-03-04");
    expect(
      document.querySelector<HTMLSelectElement>('select[name="pick"]')?.value,
    ).toBe("b");
    expect(
      document.querySelector<HTMLInputElement>('input[name="agree"]')?.checked,
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>('input[name="radio"]:checked')
        ?.value,
    ).toBe("c");
    expect(
      document.querySelector<HTMLInputElement>('input[name="boxes"]:checked')
        ?.value,
    ).toBe("a");
    expect(
      document.querySelector("fieldset legend")?.textContent?.trim(),
    ).toBeTruthy();
  });

  it("renders no error summary and no hidden field", () => {
    const form = createForm({
      fields: [
        { name: "a", required: true, label: "A" },
        { name: "b", label: "B", visibleIf: { field: "a", equals: "x" } },
      ],
    });
    const { document } = renderSSR(AllFields, { form });
    expect(document.querySelector(".bx--schema-form__summary")).toBeNull();
    expect(document.querySelector('[name="b"]')).toBeNull();
    expect(document.querySelector('[name="a"]')).not.toBeNull();
  });

  it("renders the fluid variant", () => {
    const form = createForm({ fields: [{ name: "a", label: "A" }] });
    const { document } = renderSSR(AllFields, { form, fluid: true });
    expect(document.querySelector("form.bx--form--fluid")).not.toBeNull();
  });
});
