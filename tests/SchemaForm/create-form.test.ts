import { get } from "svelte/store";
import { createForm } from "../../src/SchemaForm/create-form.js";
import type { FieldConfig } from "../../src/SchemaForm/create-form.js";

const cloud: FieldConfig[] = [
  { name: "name", required: true, label: "Name", minLength: 3 },
  { name: "kind", type: "select", options: ["vm", "bare"], default: "vm" },
  {
    name: "gpu",
    type: "number",
    label: "GPUs",
    visibleIf: { field: "kind", equals: "bare" },
  },
  { name: "password", type: "password" },
  {
    name: "confirm",
    type: "password",
    dependsOn: ["password"],
    validate: (value, values) =>
      value === values.password ? undefined : "Passwords must match",
  },
  {
    name: "disks",
    type: "array",
    minItems: 1,
    maxItems: 3,
    items: { fields: [{ name: "size", type: "number", required: true }] },
  },
];

describe("createForm", () => {
  it("starts from defaults and the initial values", () => {
    const form = createForm({
      fields: cloud,
      initialValues: { name: "web", disks: [{ size: 10 }] },
    });
    expect(form.getValues()).toEqual({
      name: "web",
      kind: "vm",
      password: "",
      confirm: "",
      disks: [{ size: 10 }],
    });
  });

  it("leaves hidden fields out of the values and keeps them in the form", () => {
    const form = createForm({ fields: cloud });
    form.setValue("gpu", 4);
    expect(form.getValues()).not.toHaveProperty("gpu");
    form.setValue("kind", "bare");
    expect(form.getValues()).toHaveProperty("gpu", 4);
    form.setValue("kind", "vm");
    expect(form.getRawValues()).toHaveProperty("gpu", 4);
  });

  it('keeps hidden values when hidden is "keep"', () => {
    const form = createForm({ fields: cloud, hidden: "keep" });
    expect(form.getValues()).toHaveProperty("gpu", null);
  });

  it("validates on blur, then on every change once there is an error", () => {
    const form = createForm({ fields: cloud });
    form.setValue("name", "a");
    expect(get(form.field("name")).error).toBeUndefined();
    form.blur("name");
    expect(get(form.field("name")).error).toBe(
      "Name must be at least 3 characters",
    );
    form.setValue("name", "abc");
    expect(get(form.field("name")).error).toBeUndefined();
  });

  it("validates on change when asked, and not before submit when asked", () => {
    const live = createForm({ fields: cloud, validateOn: "change" });
    live.setValue("name", "a");
    expect(get(live.field("name")).error).toBeDefined();

    const late = createForm({ fields: cloud, validateOn: "submit" });
    late.setValue("name", "a");
    late.blur("name");
    expect(get(late.field("name")).error).toBeUndefined();
  });

  it("re-checks a dependent field when what it depends on changes", () => {
    const form = createForm({ fields: cloud });
    form.setValue("password", "one");
    form.setValue("confirm", "two");
    form.blur("confirm");
    expect(get(form.field("confirm")).error).toBe("Passwords must match");
    form.setValue("password", "two");
    expect(get(form.field("confirm")).error).toBeUndefined();
  });

  it("aborts a stale async validation and keeps the latest result", async () => {
    const calls: string[] = [];
    const signals: AbortSignal[] = [];
    const form = createForm({
      validateOn: "change",
      fields: [
        {
          name: "handle",
          validate: (value, _values, { signal }) => {
            calls.push(String(value));
            signals.push(signal);
            return new Promise((resolve) =>
              setTimeout(
                () => resolve(value === "taken" ? "Already taken" : undefined),
                value === "taken" ? 20 : 5,
              ),
            );
          },
        },
      ],
    });
    form.setValue("handle", "taken");
    expect(get(form.field("handle")).validating).toBe(true);
    form.setValue("handle", "free");
    expect(signals[0].aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(get(form.field("handle")).error).toBeUndefined();
    expect(get(form.field("handle")).validating).toBe(false);
    expect(calls).toEqual(["taken", "free"]);
  });

  it("blocks a submit with errors and lists them in document order", async () => {
    const form = createForm({ fields: cloud });
    const handler = vi.fn();
    expect(await form.submit(handler)).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(get(form.errorList).map((e) => e.path)).toEqual([
      "name",
      "disks.0.size",
    ]);
    expect(get(form.submitCount)).toBe(1);
  });

  it("submits valid values and takes server errors back onto fields", async () => {
    const form = createForm({
      fields: cloud,
      initialValues: { name: "web", disks: [{ size: 10 }] },
    });
    const ok = await form.submit(() => ({ errors: { name: "Taken" } }));
    expect(ok).toBe(false);
    expect(get(form.field("name")).error).toBe("Taken");
    expect(get(form.isSubmitting)).toBe(false);
  });

  it("adds, moves and removes rows, and the errors follow their row", async () => {
    const form = createForm({
      fields: cloud,
      initialValues: { disks: [{ size: 1 }, { size: null }, { size: 3 }] },
    });
    await form.validate();
    expect(Object.keys(form.getErrors())).toContain("disks.1.size");
    const ids = get(form.rows("disks"));
    form.move("disks", 1, 0);
    expect(get(form.rows("disks"))).toEqual([ids[1], ids[0], ids[2]]);
    expect(Object.keys(form.getErrors())).toContain("disks.0.size");
    expect(Object.keys(form.getErrors())).not.toContain("disks.1.size");
    form.remove("disks", 0);
    expect(Object.keys(form.getErrors())).not.toContain("disks.0.size");
    expect(form.add("disks")).toBe(2);
    expect(form.add("disks")).toBe(-1);
    expect(get(form.rows("disks"))).toHaveLength(3);
  });

  it("leaves the fields of moved rows to the paths they move to", () => {
    const form = createForm({
      fields: cloud,
      initialValues: { disks: [{ size: 1 }, { size: 2 }] },
    });
    const first = vi.fn();
    const stop = form.field("disks.0.size").subscribe(first);
    first.mockClear();
    form.move("disks", 0, 1);
    // The row now at the old path is a different one, so the old path's
    // component is handed a new path instead of the new value.
    expect(first).not.toHaveBeenCalled();
    stop();
    expect(get(form.field("disks.0.size")).value).toBe(2);
    expect(get(form.field("disks.1.size")).value).toBe(1);
  });

  it("notifies only the field that changed", () => {
    const form = createForm({ fields: cloud });
    const name = vi.fn();
    const password = vi.fn();
    const stopName = form.field("name").subscribe(name);
    const stopPassword = form.field("password").subscribe(password);
    name.mockClear();
    password.mockClear();
    form.setValue("name", "web");
    expect(name).toHaveBeenCalledTimes(1);
    expect(password).not.toHaveBeenCalled();
    stopName();
    stopPassword();
  });

  it("tracks dirty and resets to the starting values", () => {
    const form = createForm({ fields: cloud, initialValues: { name: "web" } });
    expect(get(form.dirty)).toBe(false);
    form.setValue("name", "api");
    expect(get(form.field("name")).dirty).toBe(true);
    expect(get(form.dirty)).toBe(true);
    form.blur("name");
    form.reset();
    expect(get(form.field("name"))).toMatchObject({
      value: "web",
      dirty: false,
      touched: false,
    });
    form.reset({ name: "new baseline" });
    form.setValue("name", "x");
    form.reset();
    expect(get(form.field("name")).value).toBe("new baseline");
  });
});
