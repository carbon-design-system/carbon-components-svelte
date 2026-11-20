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

  it("moves ArrowLeft to the next radio and ArrowRight to the previous", () => {
    const { form, radios } = group();
    radios[1].focus();

    press(form, radios[1], "ArrowLeft", true);
    expect(radios[2]).toBeChecked();
    expect(document.activeElement).toBe(radios[2]);

    press(form, radios[2], "ArrowRight", true);
    expect(radios[1]).toBeChecked();
  });

  it("wraps at the ends and skips a disabled radio", () => {
    const { form, radios } = group([0]);

    press(form, radios[1], "ArrowRight", true);

    expect(radios[3]).toBeChecked();
  });
});
