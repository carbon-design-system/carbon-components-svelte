import { moveRadioInRtl } from "../../src/utils/rtl-radio-keys.js";

function group(disabled: number[] = []) {
  const form = document.createElement("form");
  const radios = [0, 1, 2, 3].map((value) => {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "q";
    radio.value = String(value);
    radio.disabled = disabled.includes(value);
    form.append(radio);
    return radio;
  });
  document.body.append(form);
  return { form, radios };
}

function press(
  form: HTMLFormElement,
  target: HTMLInputElement,
  key: string,
  rtl: boolean,
) {
  let moved = false;
  form.addEventListener("keydown", (event) => {
    moved = moveRadioInRtl(event, rtl);
  });
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
  return moved;
}

describe("moveRadioInRtl", () => {
  afterEach(() => (document.body.innerHTML = ""));

  it("leaves a left-to-right group to the browser", () => {
    const { form, radios } = group();

    expect(press(form, radios[1], "ArrowLeft", false)).toBe(false);
    expect(radios.some((radio) => radio.checked)).toBe(false);
  });

  it("wraps at the ends and skips a disabled radio", () => {
    const { form, radios } = group([0]);

    press(form, radios[1], "ArrowRight", true);

    expect(radios[3]).toBeChecked();
  });
});
