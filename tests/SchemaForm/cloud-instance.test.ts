import { render, screen } from "@testing-library/svelte";
import { createForm } from "carbon-components-svelte/SchemaForm/create-form.js";
import type { FieldConfig } from "carbon-components-svelte/SchemaForm/create-form.js";
import { tick } from "svelte";
import { get } from "svelte/store";
import AllFields from "./AllFields.test.svelte";

// The form is the docs example, which exports its fields.
const { fields } =
  (await import("../../docs/src/pages/framed/SchemaForm/CloudInstance.svelte")) as unknown as {
    fields: FieldConfig[];
  };

const valid = {
  basics: { name: "web-1", owner: "ada@example.com", region: "eu-de" },
  compute: { size: "m" },
  storage: { disks: [{ size: 50 }] },
  access: {
    adminPassword: "correct horse battery",
    confirmPassword: "correct horse battery",
  },
};

describe("Create cloud instance", () => {
  it("renders every field of the form", () => {
    const form = createForm({ fields, initialValues: valid });
    render(AllFields, { form });
    const form_ = screen.getByTestId("form");
    // 30+ leaf fields, minus the two GPU fields that start hidden.
    expect(form_.querySelectorAll("[data-schema-path]").length).toBeGreaterThan(
      28,
    );
    expect(
      form_.querySelector('[data-schema-path="compute.gpuModel"]'),
    ).toBeNull();
  });

  it("lists the required fields in document order on an empty submit", async () => {
    const form = createForm({ fields });
    await form.submit();
    expect(get(form.errorList).map((e) => e.path)).toEqual([
      "basics.name",
      "basics.owner",
      "basics.region",
      "compute.size",
      "access.adminPassword",
      "access.confirmPassword",
    ]);
  });

  it("passes with valid values and leaves the hidden GPU fields out", async () => {
    const form = createForm({ fields, initialValues: valid });
    expect(await form.submit()).toBe(true);
    const values = form.getValues();
    expect(values.compute).not.toHaveProperty("gpuModel");
    expect(values.compute).toMatchObject({ size: "m", vcpu: 4, memory: 8 });
    form.setValue("compute.gpu", true);
    await tick();
    expect(form.getValues().compute).toHaveProperty("gpuCount", 1);
    expect(await form.validate()).toBe(false);
    expect(Object.keys(form.getErrors())).toEqual(["compute.gpuModel"]);
  });

  it("takes the name check from a validator that aborts", async () => {
    const form = createForm({ fields, initialValues: valid });
    form.setValue("basics.name", "taken");
    form.blur("basics.name");
    expect(get(form.field("basics.name")).validating).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(get(form.field("basics.name")).error).toBe(
      "That name is already in use",
    );
  });

  it("checks the confirmation against the password", () => {
    const form = createForm({ fields, initialValues: valid });
    form.setValue("access.confirmPassword", "different");
    form.blur("access.confirmPassword");
    expect(get(form.field("access.confirmPassword")).error).toBe(
      "The passwords do not match",
    );
    form.setValue("access.adminPassword", "different");
    expect(get(form.field("access.confirmPassword")).error).toBeUndefined();
  });
});
