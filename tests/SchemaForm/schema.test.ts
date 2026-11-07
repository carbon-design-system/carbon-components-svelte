import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import type { FieldOption } from "carbon-components-svelte/SchemaForm/create-form.js";
import { schemaToFields } from "carbon-components-svelte/SchemaForm/schema.js";
import { get } from "svelte/store";

const schema = {
  $defs: {
    address: {
      type: "object",
      required: ["city"],
      properties: {
        city: { type: "string", title: "City", minLength: 2 },
        zip: { type: "string", pattern: "^\\d{5}$" },
      },
    },
  },
  type: "object",
  required: ["email", "plan", "terms"],
  properties: {
    email: { type: "string", format: "email", title: "Email" },
    age: { type: "integer", minimum: 18, maximum: 99 },
    plan: {
      type: "string",
      oneOf: [
        { const: "free", title: "Free" },
        { const: "pro", title: "Pro" },
      ],
    },
    color: { enum: ["red", "green", "blue"] },
    terms: { type: "boolean", const: true, title: "Accept" },
    newsletter: { type: "boolean" },
    notes: { type: "string", maxLength: 500 },
    tags: { type: "array", items: { type: "string" }, maxItems: 3 },
    roles: {
      type: "array",
      uniqueItems: true,
      items: { enum: ["admin", "dev"] },
    },
    home: { $ref: "#/$defs/address" },
    contacts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: { name: { type: "string" }, phone: { type: "string" } },
        required: ["name"],
      },
    },
    payment: {
      oneOf: [
        {
          title: "Card",
          required: ["kind", "number"],
          properties: {
            kind: { const: "card" },
            number: { type: "string", pattern: "^\\d{16}$" },
          },
        },
        {
          title: "Invoice",
          required: ["kind", "po"],
          properties: {
            kind: { const: "invoice" },
            po: { type: "string" },
          },
        },
      ],
    },
  },
};

describe("schemaToFields", () => {
  const fields = schemaToFields(schema);
  const by = (name: string) => {
    const found = fields.find((f) => f.name === name);
    if (!found) throw new Error(`no field ${name}`);
    return found;
  };

  it("maps types, formats and widgets", () => {
    expect(by("email")).toMatchObject({ type: "email", required: true });
    expect(by("age")).toMatchObject({ type: "integer", min: 18, max: 99 });
    expect(by("plan")).toMatchObject({
      type: "select",
      options: [
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
      ],
    });
    expect(by("color").options).toHaveLength(3);
    expect(by("notes")).toMatchObject({ type: "textarea", maxLength: 500 });
    expect(by("tags")).toMatchObject({ type: "tags", maxItems: 3 });
    expect(by("roles")).toMatchObject({ type: "checkboxes" });
  });

  it("follows a local $ref and keeps required per object", () => {
    expect(by("home").fields?.map((f) => [f.name, f.required])).toEqual([
      ["city", true],
      ["zip", undefined],
    ]);
  });

  it("makes arrays of objects repeatable groups", () => {
    expect(by("contacts")).toMatchObject({ type: "array", minItems: 1 });
    expect(by("contacts").items?.fields?.map((f) => f.name)).toEqual([
      "name",
      "phone",
    ]);
  });

  it("folds a discriminated oneOf into a select and conditional fields", () => {
    const payment = by("payment").fields ?? [];
    const named = (name: string) => {
      const found = payment.find((f) => f.name === name);
      if (!found) throw new Error(`no field ${name}`);
      return found;
    };
    expect(payment.map((f) => f.name)).toEqual(["kind", "number", "po"]);
    expect(named("number").visibleIf).toEqual({ field: "kind", in: ["card"] });
    expect(
      (named("kind").options as FieldOption[]).map((o) => o.label),
    ).toEqual(["Card", "Invoice"]);
  });

  it("does not demand an unchecked boolean unless it is const true", () => {
    expect(by("newsletter").required).toBeUndefined();
    expect(by("terms")).toMatchObject({ required: true, const: true });
  });

  it("rejects a $ref to another document and a cycle", () => {
    expect(() =>
      schemaToFields({
        type: "object",
        properties: { a: { $ref: "https://example.com/a.json" } },
      }),
    ).toThrow(/only a "\$ref" inside the same schema/);
    expect(() =>
      schemaToFields({
        $defs: { loop: { $ref: "#/$defs/loop" } },
        type: "object",
        properties: { a: { $ref: "#/$defs/loop" } },
      }),
    ).toThrow(/refers to itself/);
  });

  it("applies RJSF ui: options", () => {
    const [field] = schemaToFields(
      { type: "object", properties: { bio: { type: "string" } } },
      { bio: { "ui:widget": "textarea", "ui:help": "Short", "ui:order": [] } },
    );
    expect(field).toMatchObject({ type: "textarea", helperText: "Short" });
    const ordered = schemaToFields(
      {
        type: "object",
        properties: { a: { type: "string" }, b: { type: "string" } },
      },
      { "ui:order": ["b", "a"] },
    );
    expect(ordered.map((f) => f.name)).toEqual(["b", "a"]);
  });
});

describe("a form from a schema", () => {
  const form = () =>
    createForm({
      schema,
      initialValues: {
        email: "a@b.co",
        plan: "pro",
        terms: true,
        home: { city: "Oslo" },
        contacts: [{ name: "Ada" }],
        payment: { kind: "card", number: "4111111111111111" },
      },
    });

  it("validates the JSON Schema keywords", async () => {
    const f = form();
    f.setValue("age", 12);
    f.setValue("email", "nope");
    f.setValue("home.zip", "12");
    f.setValue("payment.number", "4111");
    expect(await f.validate()).toBe(false);
    const errors = f.getErrors();
    expect(errors.age).toBe("age must be at least 18");
    expect(errors.email).toBe("Email must be a valid email address");
    expect(errors["home.zip"]).toMatch(/format/);
    expect(errors["payment.number"]).toMatch(/format/);
    expect(errors).not.toHaveProperty("payment.po");
  });

  it("leaves the fields of the other variant out of the values", () => {
    const f = form();
    f.setValue("payment.kind", "invoice");
    f.setValue("payment.po", "PO-1");
    const { payment } = f.getValues();
    expect(payment).toMatchObject({ kind: "invoice", po: "PO-1" });
    expect(payment).not.toHaveProperty("number");
  });

  it("passes a valid form", async () => {
    const f = form();
    expect(await f.validate()).toBe(true);
    expect(get(f.errorList)).toEqual([]);
  });
});
