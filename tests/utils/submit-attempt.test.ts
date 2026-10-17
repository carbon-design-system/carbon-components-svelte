import {
  isSubmitAttempt,
  submitAttempts,
} from "../../src/utils/submit-attempt";
import { flushMacrotask } from "./flush-macrotask";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(markup = '<input name="q"><button>Go</button>') {
  document.body.innerHTML = `<form>${markup}</form>`;
  const form = document.querySelector("form") as HTMLFormElement;
  form.addEventListener("submit", (event) => event.preventDefault());
  return form;
}

describe("submitAttempts", () => {
  it("reports a submit button click until the task ends", async () => {
    const form = setup();
    const action = submitAttempts(form);
    let during = false;
    form.addEventListener("submit", () => {
      during = isSubmitAttempt(form);
    });

    form.querySelector("button")?.click();
    expect(during).toBe(true);
    await flushMacrotask();
    expect(isSubmitAttempt(form)).toBe(false);
    action.destroy();
  });

  it("reports Enter in a text field", () => {
    const form = setup();
    const action = submitAttempts(form);
    const input = form.querySelector("input") as HTMLInputElement;

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(isSubmitAttempt(form)).toBe(true);
    action.destroy();
  });

  it("ignores formnovalidate buttons and non-submit buttons", () => {
    const form = setup(
      '<button formnovalidate>Save draft</button><button type="button">Help</button>',
    );
    const action = submitAttempts(form);

    for (const button of form.querySelectorAll("button")) button.click();
    expect(isSubmitAttempt(form)).toBe(false);
    action.destroy();
  });

  it("stops tracking once every action is destroyed or disabled", () => {
    const form = setup();
    const first = submitAttempts(form);
    const second = submitAttempts(form, false);
    first.destroy();
    second.update(false);

    form.querySelector("button")?.click();
    expect(isSubmitAttempt(form)).toBe(false);
  });
});
