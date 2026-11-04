import { render, screen } from "@testing-library/svelte";
import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import type { FieldConfig } from "carbon-components-svelte/SchemaForm/create-form.js";
import { tick } from "svelte";
import { user } from "../utils/user";
import AllFields from "./AllFields.test.svelte";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
];

type Case = {
  type: string;
  config?: Partial<FieldConfig>;
  /** The value `form.setValue` puts in, and that the control must show. */
  set: unknown;
  /** What the control shows. */
  shows: (form: HTMLElement) => unknown;
  /** What the control shows for `set`. */
  showsSet: unknown;
  /** Drive the control as a user would. */
  act: () => Promise<void>;
  /** The form value afterwards. */
  expected: unknown;
};

const input = (form: HTMLElement, selector = "input") =>
  form.querySelector(selector) as HTMLInputElement;

const checked = (f: HTMLElement) =>
  [...f.querySelectorAll<HTMLInputElement>("input:checked")].map(
    (i) => i.value,
  );

const cases: Case[] = [
  {
    type: "text",
    set: "hello",
    shows: (f) => input(f).value,
    showsSet: "hello",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "typed");
    },
    expected: "typed",
  },
  {
    type: "email",
    set: "a@b.co",
    shows: (f) => input(f).value,
    showsSet: "a@b.co",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "x@y.zz");
    },
    expected: "x@y.zz",
  },
  {
    type: "password",
    set: "s3cret",
    shows: (f) => input(f).value,
    showsSet: "s3cret",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "pw");
    },
    expected: "pw",
  },
  {
    type: "textarea",
    set: "notes",
    shows: (f) => (f.querySelector("textarea") as HTMLTextAreaElement).value,
    showsSet: "notes",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "abc");
    },
    expected: "abc",
  },
  {
    type: "search",
    set: "q",
    shows: (f) => input(f).value,
    showsSet: "q",
    act: async () => {
      await user.clear(screen.getByRole("searchbox"));
      await user.type(screen.getByRole("searchbox"), "find");
    },
    expected: "find",
  },
  {
    type: "number",
    set: 7,
    shows: (f) => input(f).value,
    showsSet: "7",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "42");
    },
    expected: 42,
  },
  {
    type: "slider",
    config: { min: 0, max: 100 },
    set: 30,
    shows: () => screen.getByRole("slider").getAttribute("aria-valuenow"),
    showsSet: "30",
    act: async () => {
      await user.clear(screen.getByRole("spinbutton"));
      await user.type(screen.getByRole("spinbutton"), "55");
      await user.tab();
    },
    expected: 55,
  },
  {
    type: "rangeslider",
    config: { min: 0, max: 100 },
    set: [20, 60],
    shows: () =>
      screen.getAllByRole("slider").map((s) => s.getAttribute("aria-valuenow")),
    showsSet: ["20", "60"],
    act: async () => {
      const [low] = screen.getAllByRole("spinbutton");
      await user.clear(low);
      await user.type(low, "10");
      await user.tab();
    },
    expected: [10, 60],
  },
  {
    type: "select",
    config: { options },
    set: "b",
    shows: (f) => (f.querySelector("select") as HTMLSelectElement).value,
    showsSet: "b",
    act: async () => {
      await user.selectOptions(screen.getByLabelText("Field"), "c");
    },
    expected: "c",
  },
  {
    type: "dropdown",
    config: { options },
    set: "b",
    shows: (f) => f.querySelector(".bx--list-box__label")?.textContent,
    showsSet: "Beta",
    act: async () => {
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Gamma"));
    },
    expected: "c",
  },
  {
    type: "combobox",
    config: { options },
    set: "b",
    shows: (f) => input(f).value,
    showsSet: "Beta",
    act: async () => {
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Gamma"));
    },
    expected: "c",
  },
  {
    type: "multiselect",
    config: { options },
    set: ["a", "c"],
    shows: (f) => f.querySelector(".bx--tag__label")?.textContent,
    showsSet: "2",
    act: async () => {
      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByText("Beta"));
    },
    expected: ["a", "c", "b"],
  },
  {
    type: "checkbox",
    set: true,
    shows: (f) => input(f).checked,
    showsSet: true,
    act: async () => {
      await user.click(screen.getByLabelText("Field"));
    },
    expected: false,
  },
  {
    type: "toggle",
    set: true,
    shows: () => (screen.getByRole("switch") as HTMLInputElement).checked,
    showsSet: true,
    act: async () => {
      await user.click(screen.getByRole("switch"));
    },
    expected: false,
  },
  {
    type: "radio",
    config: { options },
    set: "b",
    shows: checked,
    showsSet: ["b"],
    act: async () => {
      await user.click(screen.getByLabelText("Gamma"));
    },
    expected: "c",
  },
  {
    type: "checkboxes",
    config: { options },
    set: ["a", "c"],
    shows: checked,
    showsSet: ["a", "c"],
    act: async () => {
      await user.click(screen.getByLabelText("Beta"));
    },
    expected: ["a", "c", "b"],
  },
  {
    type: "togglebuttons",
    config: { options },
    set: ["a"],
    shows: (f) =>
      [...f.querySelectorAll("[aria-pressed=true]")].map((b) =>
        b.textContent?.trim(),
      ),
    showsSet: ["Alpha"],
    act: async () => {
      await user.click(screen.getByText("Gamma"));
    },
    expected: ["a", "c"],
  },
  {
    type: "tags",
    set: ["x", "y"],
    shows: (f) =>
      [...f.querySelectorAll(".bx--tag")].map((t) =>
        t.textContent?.replace(/\s+/g, " ").trim(),
      ),
    showsSet: expect.arrayContaining([expect.stringContaining("x")]),
    act: async () => {
      await user.type(screen.getByRole("textbox"), "new,");
    },
    expected: ["x", "y", "new"],
  },
  {
    type: "time",
    set: "09:30",
    shows: (f) => input(f).value,
    showsSet: "09:30",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "10:15");
    },
    expected: "10:15",
  },
  {
    type: "rating",
    set: 3,
    shows: checked,
    showsSet: ["3"],
    act: async () => {
      await user.click(screen.getAllByRole("radio")[1]);
    },
    expected: 2,
  },
  {
    type: "pin",
    config: { maxLength: 4 },
    set: "1234",
    shows: (f) =>
      [...f.querySelectorAll<HTMLInputElement>("input")]
        .map((i) => i.value)
        .join(""),
    showsSet: "1234",
    act: async () => {
      await user.click(screen.getAllByRole("textbox")[0]);
      await user.keyboard("9876");
    },
    expected: "9876",
  },
  {
    type: "date",
    set: "2026-03-04",
    shows: (f) => input(f).value,
    showsSet: "2026-03-04",
    act: async () => {
      await user.clear(screen.getByLabelText("Field"));
      await user.type(screen.getByLabelText("Field"), "2027-05-06");
      await user.tab();
    },
    expected: "2027-05-06",
  },
];

describe("SchemaForm widgets", () => {
  describe.each(cases)("$type", (c) => {
    const setup = () => {
      const form = createForm({
        fields: [{ name: "field", type: c.type, label: "Field", ...c.config }],
      });
      render(AllFields, { form });
      return { form, el: screen.getByTestId("form") };
    };

    it("shows a value put into the form", async () => {
      const { form, el } = setup();
      form.setValue("field", c.set);
      await tick();
      expect(c.shows(el)).toEqual(c.showsSet);
    });

    it("puts what the user enters into the form", async () => {
      const { form } = setup();
      form.setValue("field", c.set);
      await tick();
      await c.act();
      await tick();
      expect(form.getRawValues().field).toEqual(c.expected);
    });

    it("shows the starting value again after a reset", async () => {
      const { form, el } = setup();
      const start = form.getRawValues().field;
      form.setValue("field", c.set);
      await tick();
      form.reset();
      await tick();
      expect(form.getRawValues().field).toEqual(start);
      expect(c.shows(el)).not.toEqual(c.showsSet);
    });
  });
});
