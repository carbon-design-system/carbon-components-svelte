import { requiredInvalid } from "../../src/utils/required-invalid.js";
import { flushFormReset } from "./flush-form-reset";
import { user } from "./user";

function setup(markup: string) {
  const form = document.createElement("form");
  form.innerHTML = `${markup}<button type="submit">Submit</button>`;
  form.addEventListener("submit", (event) => event.preventDefault());
  document.body.append(form);
  return form;
}

/** Click the form's submit button, as a user submitting it would. */
async function attemptSubmit(form: HTMLFormElement) {
  const submit = form.querySelector<HTMLButtonElement>("button[type=submit]");
  assert(submit);
  await user.click(submit);
  await new Promise((resolve) => setTimeout(resolve));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("requiredInvalid", () => {
  it("cancels the bubble for an empty required control and focuses it", async () => {
    const form = setup('<input required name="a"><input required name="b">');
    const [first, second] = form.querySelectorAll("input");
    const onChange = vi.fn();
    requiredInvalid(first, { onChange });
    requiredInvalid(second, { onChange });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    await attemptSubmit(form);

    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.every((event) => event.defaultPrevented)).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(first).toHaveFocus();
  });

  it("shows nothing when code calls checkValidity()", async () => {
    const form = setup("<input required>");
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    requiredInvalid(input, { onChange });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    expect(form.checkValidity()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve));

    expect(invalid[0].defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(input).not.toHaveFocus();
  });

  it("always cancels the event for a proxy input", () => {
    const form = setup("<input required>");
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    requiredInvalid(input, { onChange, proxy: true });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    form.checkValidity();

    expect(invalid[0].defaultPrevented).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does nothing while disabled, and starts when enabled", async () => {
    const form = setup("<input required>");
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    const action = requiredInvalid(input, { onChange, enabled: false });

    await attemptSubmit(form);
    expect(onChange).not.toHaveBeenCalled();

    action.update({ onChange, enabled: true });
    await attemptSubmit(form);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("leaves other constraint failures to the browser", async () => {
    const form = setup('<input required pattern="[0-9]+" value="abc">');
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    requiredInvalid(input, { onChange });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    await attemptSubmit(form);

    expect(invalid[0].defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles the controls inside a container and a custom focus target", async () => {
    const form = setup(
      '<fieldset><input type="radio" name="r" required><input type="radio" name="r" required></fieldset><button type="button">Field</button>',
    );
    const fieldset = form.querySelector("fieldset");
    const button = form.querySelector("button[type=button]");
    assert(fieldset && button instanceof HTMLElement);
    const onChange = vi.fn();
    requiredInvalid(fieldset, { onChange, getFocusTarget: () => button });

    await attemptSubmit(form);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(button).toHaveFocus();
  });

  it("reports false when the form resets, and stops after destroy", async () => {
    const form = setup("<input required>");
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    const action = requiredInvalid(input, { onChange });

    form.reset();
    await flushFormReset();
    expect(onChange).toHaveBeenLastCalledWith(false);

    action.destroy();
    onChange.mockClear();
    await attemptSubmit(form);
    expect(onChange).not.toHaveBeenCalled();
  });
});
