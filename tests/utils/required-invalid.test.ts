import { requiredInvalid } from "../../src/utils/required-invalid.js";
import { flushFormReset } from "./flush-form-reset";

function setup(markup: string) {
  const form = document.createElement("form");
  form.innerHTML = markup;
  document.body.append(form);
  return form;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("requiredInvalid", () => {
  it("cancels the bubble for an empty required control and focuses it", () => {
    const form = setup('<input required name="a"><input required name="b">');
    const [first, second] = form.querySelectorAll("input");
    const onChange = vi.fn();
    requiredInvalid(first, { onChange });
    requiredInvalid(second, { onChange });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    expect(form.reportValidity()).toBe(false);

    expect(invalid.every((event) => event.defaultPrevented)).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(first).toHaveFocus();
  });

  it("leaves other constraint failures to the browser", () => {
    const form = setup('<input required pattern="[0-9]+" value="abc">');
    const input = form.querySelector("input");
    assert(input);
    const onChange = vi.fn();
    requiredInvalid(input, { onChange });

    const invalid: Event[] = [];
    form.addEventListener("invalid", (e) => invalid.push(e), true);
    form.reportValidity();

    expect(invalid[0].defaultPrevented).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles the controls inside a container and a custom focus target", () => {
    const form = setup(
      '<fieldset><input type="radio" name="r" required><input type="radio" name="r" required></fieldset><button type="button">Field</button>',
    );
    const fieldset = form.querySelector("fieldset");
    const button = form.querySelector("button");
    assert(fieldset && button);
    const onChange = vi.fn();
    requiredInvalid(fieldset, { onChange, getFocusTarget: () => button });

    form.reportValidity();

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
    form.reportValidity();
    expect(onChange).not.toHaveBeenCalled();
  });
});
