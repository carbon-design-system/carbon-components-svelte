// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import NaturalDateInput from "./NaturalDateInput.test.svelte";

const field = (document: Document) =>
  document.querySelector<HTMLInputElement>("input.bx--text-input");

describe("NaturalDateInput server render", () => {
  it("renders the field, the calendar button and no calendar", () => {
    const { document } = renderSSR(NaturalDateInput);

    expect(field(document)?.getAttribute("placeholder")).toBe(
      "tomorrow, next Fri 3pm, Dec 3",
    );
    expect(document.querySelector("label")?.textContent?.trim()).toBe(
      "Due date",
    );
    expect(
      document.querySelector("button[aria-haspopup='dialog']"),
    ).not.toBeNull();
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.querySelector("[role='status']")?.textContent).toBe("");
  });

  it("writes a date given as value, in the zone it is given", () => {
    const value = new Date("2026-12-03T20:00:00Z");
    const ny = renderSSR(NaturalDateInput, { value });
    const berlin = renderSSR(NaturalDateInput, {
      value,
      timeZone: "Europe/Berlin",
      locale: "de",
    });

    expect(field(ny.document)?.getAttribute("value")).toBe(
      "Dec 3, 2026, 3:00 PM",
    );
    expect(field(berlin.document)?.getAttribute("value")).toBe(
      "3. Dez. 2026, 21:00",
    );
  });

  it("reads the interpretation of the text without a browser", () => {
    const { document } = renderSSR(NaturalDateInput, {
      text: "tomorrow 3pm",
    });

    const helper = document.querySelector(".bx--form__helper-text");
    expect(helper?.textContent?.replace(/[\u2068\u2069]/g, "")).toMatch(
      /^Friday, Nov 13, 2026(,| at) 3:00 PM$/,
    );
    expect(
      document
        .querySelector("input.bx--text-input")
        ?.getAttribute("aria-describedby"),
    ).toBe(helper?.id);
  });

  it("renders the same twice, so a page can hydrate", () => {
    const props = { value: "2026-12-03", name: "due" };

    expect(renderSSR(NaturalDateInput, props).html).toBe(
      renderSSR(NaturalDateInput, props).html,
    );
  });

  it("puts the date in the hidden input of a named field", () => {
    const { document } = renderSSR(NaturalDateInput, {
      text: "dec 3 3pm",
      name: "due",
    });

    const hidden = document.querySelector<HTMLInputElement>(
      "input[type='hidden'][name='due']",
    );
    expect(hidden?.getAttribute("value")).toBe("2026-12-03T20:00:00.000Z");
    // The text input has no name, so the text is not submitted.
    expect(field(document)?.hasAttribute("name")).toBe(false);
  });
});
