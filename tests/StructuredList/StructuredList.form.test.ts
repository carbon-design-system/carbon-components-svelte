import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import StructuredListForm from "./StructuredList.form.test.svelte";

const flushMicrotasks = () => new Promise<void>(queueMicrotask);

const getInputs = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>(
      "input.bx--structured-list-input",
    ),
  );

describe("StructuredList form reset", () => {
  it("clears a single selection without firing change", async () => {
    const onChange = vi.fn();
    render(StructuredListForm, { props: { onChange } });

    await user.click(getInputs()[1]);
    expect(getBoundText()).toBe('"mongodb"');
    onChange.mockClear();

    await resetForm();

    expect(getBoundText()).toBe("undefined");
    for (const input of getInputs()) expect(input).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    // The next user selection still reports `change`.
    await user.click(getInputs()[2]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("clears a multiple selection", async () => {
    const onChange = vi.fn();
    render(StructuredListForm, {
      props: { multiple: true, selected: ["postgresql", "redis"], onChange },
    });
    expect(getInputs()[0]).toBeChecked();

    await resetForm();

    expect(getBoundText()).toBe("[]");
    expect(new FormData(getForm()).getAll("engine")).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("follows the row's default state, as with server-rendered markup", async () => {
    render(StructuredListForm);

    // Server-rendered markup carries the state as the `checked` attribute.
    getInputs()[0].defaultChecked = true;
    await user.click(getInputs()[2]);

    await resetForm();

    expect(getBoundText()).toBe('"postgresql"');
    expect(getInputs()[0]).toBeChecked();
  });
});

describe("StructuredList form submission", () => {
  it("submits the selected radio's value", async () => {
    render(StructuredListForm);

    await user.click(getInputs()[1]);

    expect(new FormData(getForm()).getAll("engine")).toEqual(["mongodb"]);
  });

  it("submits every checked checkbox's value", async () => {
    render(StructuredListForm, { props: { multiple: true } });

    await user.click(getInputs()[0]);
    await user.click(getInputs()[2]);

    expect(new FormData(getForm()).getAll("engine")).toEqual([
      "postgresql",
      "redis",
    ]);
  });
});

describe("StructuredList rows mounted or removed after the list", () => {
  it("selects a row mounted `checked` without firing change", async () => {
    const onChange = vi.fn();
    const { rerender } = render(StructuredListForm, {
      props: {
        multiple: true,
        selected: ["postgresql"],
        checkedEngines: ["postgresql", "sqlite"],
        onChange,
      },
    });
    expect(getBoundText()).toBe('["postgresql"]');

    await rerender({ engines: ["postgresql", "mongodb", "redis", "sqlite"] });

    expect(getBoundText()).toBe('["postgresql","sqlite"]');
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the selection when its row unmounts", async () => {
    const onChange = vi.fn();
    const { rerender } = render(StructuredListForm, {
      props: { selected: "redis", onChange },
    });

    // The unkeyed `{#each}` moves "redis" to another row's input.
    await rerender({ engines: ["mongodb", "redis"] });
    await flushMicrotasks();
    await tick();
    expect(getBoundText()).toBe('"redis"');

    await rerender({ engines: ["mongodb"] });
    await flushMicrotasks();
    await tick();

    expect(getBoundText()).toBe("undefined");
    expect(onChange).not.toHaveBeenCalled();
  });
});
