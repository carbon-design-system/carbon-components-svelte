import { formReset } from "../../src/utils/form-reset.js";
import { flushFormReset } from "./flush-form-reset";

describe("formReset action", () => {
  let form: HTMLFormElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="f"><input id="i" value="default"><fieldset id="fs"></fieldset></form>
      <form id="g"></form>
      <input id="outside" form="f" value="outside-default">
      <input id="orphan">
    `;
    const foundForm = document.querySelector<HTMLFormElement>("#f");
    const foundInput = document.querySelector<HTMLInputElement>("#i");
    assert(foundForm);
    assert(foundInput);
    form = foundForm;
    input = foundInput;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("calls back on the next task, after the form restores its controls", async () => {
    const seen: string[] = [];
    const action = formReset(input, () => seen.push(input.value));

    input.value = "typed";
    form.reset();
    expect(seen).toEqual([]);

    await flushFormReset();
    expect(seen).toEqual(["default"]);

    action.destroy();
  });

  it("ignores another form's reset", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);

    document.querySelector<HTMLFormElement>("#g")?.reset();
    await flushFormReset();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  it("skips a canceled reset", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);
    form.addEventListener("reset", (event) => event.preventDefault());

    form.reset();
    await flushFormReset();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  it("follows the form attribute", async () => {
    const onReset = vi.fn();
    const outside = document.querySelector<HTMLInputElement>("#outside");
    assert(outside);
    const action = formReset(outside, onReset);

    form.reset();
    await flushFormReset();
    expect(onReset).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("never calls back for a control without a form", async () => {
    const onReset = vi.fn();
    const orphan = document.querySelector<HTMLInputElement>("#orphan");
    assert(orphan);
    const action = formReset(orphan, onReset);

    form.reset();
    await flushFormReset();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  it("works on a fieldset", async () => {
    const onReset = vi.fn();
    const fieldset = document.querySelector<HTMLFieldSetElement>("#fs");
    assert(fieldset);
    const action = formReset(fieldset, onReset);

    form.reset();
    await flushFormReset();
    expect(onReset).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("does not call back after destroy", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);

    form.reset();
    action.destroy();
    await flushFormReset();
    expect(onReset).not.toHaveBeenCalled();

    form.reset();
    await flushFormReset();
    expect(onReset).not.toHaveBeenCalled();
  });

  it("calls the latest callback after update", async () => {
    const first = vi.fn();
    const next = vi.fn();
    const action = formReset(input, first);

    action.update(next);
    form.reset();
    await flushFormReset();
    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("shares one window listener across consumers", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const first = vi.fn();
    const second = vi.fn();
    const fieldset = document.querySelector<HTMLFieldSetElement>("#fs");
    assert(fieldset);

    const a = formReset(input, first);
    const b = formReset(fieldset, second);
    const resetAdds = addSpy.mock.calls.filter(([type]) => type === "reset");
    expect(resetAdds).toHaveLength(1);

    form.reset();
    await flushFormReset();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    a.destroy();
    expect(
      removeSpy.mock.calls.filter(([type]) => type === "reset"),
    ).toHaveLength(0);
    b.destroy();
    expect(
      removeSpy.mock.calls.filter(([type]) => type === "reset"),
    ).toHaveLength(1);
  });
});
