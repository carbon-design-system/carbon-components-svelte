import { formReset } from "../../src/utils/form-reset.js";

/** The callback is deferred by a macrotask; flush it before asserting. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

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
    form = document.getElementById("f") as HTMLFormElement;
    input = document.getElementById("i") as HTMLInputElement;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("calls back on the next task, after the form restores its controls", async () => {
    const seen: string[] = [];
    const action = formReset(input, () => seen.push(input.value));

    input.value = "typed";
    form.reset();
    expect(seen).toEqual([]);

    await flush();
    expect(seen).toEqual(["default"]);

    action.destroy();
  });

  test("ignores another form's reset", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);

    (document.getElementById("g") as HTMLFormElement).reset();
    await flush();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  test("skips a canceled reset", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);
    form.addEventListener("reset", (event) => event.preventDefault());

    form.reset();
    await flush();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  test("follows the form attribute", async () => {
    const onReset = vi.fn();
    const outside = document.getElementById("outside") as HTMLInputElement;
    const action = formReset(outside, onReset);

    form.reset();
    await flush();
    expect(onReset).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("never calls back for a control without a form", async () => {
    const onReset = vi.fn();
    const orphan = document.getElementById("orphan") as HTMLInputElement;
    const action = formReset(orphan, onReset);

    form.reset();
    await flush();
    expect(onReset).not.toHaveBeenCalled();

    action.destroy();
  });

  test("works on a fieldset", async () => {
    const onReset = vi.fn();
    const fieldset = document.getElementById("fs") as HTMLFieldSetElement;
    const action = formReset(fieldset, onReset);

    form.reset();
    await flush();
    expect(onReset).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("does not call back after destroy", async () => {
    const onReset = vi.fn();
    const action = formReset(input, onReset);

    form.reset();
    action.destroy();
    await flush();
    expect(onReset).not.toHaveBeenCalled();

    form.reset();
    await flush();
    expect(onReset).not.toHaveBeenCalled();
  });

  test("calls the latest callback after update", async () => {
    const first = vi.fn();
    const next = vi.fn();
    const action = formReset(input, first);

    action.update(next);
    form.reset();
    await flush();
    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("shares one window listener across consumers", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const first = vi.fn();
    const second = vi.fn();
    const fieldset = document.getElementById("fs") as HTMLFieldSetElement;

    const a = formReset(input, first);
    const b = formReset(fieldset, second);
    const resetAdds = addSpy.mock.calls.filter(([type]) => type === "reset");
    expect(resetAdds).toHaveLength(1);

    form.reset();
    await flush();
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
