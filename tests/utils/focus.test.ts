import { initialFocus, restoreFocus } from "../../src/utils/focus.js";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

describe("initialFocus", () => {
  test("returns the selectorPrimaryFocus match when present", () => {
    const container = setup(`
      <input />
      <button data-modal-primary-focus>Primary</button>
    `);
    const expected = container.querySelector("[data-modal-primary-focus]");

    expect(initialFocus({ container })).toBe(expected);
  });

  test("falls back to the first form input", () => {
    const container = setup(`
      <input id="first" />
      <input id="second" />
    `);

    expect(initialFocus({ container })).toBe(container.querySelector("#first"));
  });

  test("falls back to the first truthy fallbacks candidate", () => {
    const container = setup("<p>No focusable selector or input</p>");
    const closeButton = document.createElement("button");

    expect(
      initialFocus({ container, fallbacks: [null, undefined, closeButton] }),
    ).toBe(closeButton);
  });

  test("returns null when selectorPrimaryFocus is null", () => {
    const container = setup("<input />");

    expect(initialFocus({ container, selectorPrimaryFocus: null })).toBeNull();
  });

  test("returns null when container is null", () => {
    expect(initialFocus({ container: null })).toBeNull();
  });

  test("returns null when nothing matches", () => {
    const container = setup("<p>Nothing focusable</p>");

    expect(initialFocus({ container })).toBeNull();
  });
});

describe("restoreFocus", () => {
  test("save() then restore() returns focus to the saved element", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const focusReturn = restoreFocus();
    focusReturn.save();

    // Focus moves elsewhere while the overlay is open.
    const other = document.createElement("button");
    document.body.appendChild(other);
    other.focus();
    expect(document.activeElement).toBe(other);

    focusReturn.restore();
    expect(document.activeElement).toBe(trigger);
  });

  test("restore() is a no-op when the saved element was removed from the DOM", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const focusReturn = restoreFocus();
    focusReturn.save();

    trigger.remove();
    const other = document.createElement("button");
    document.body.appendChild(other);
    other.focus();

    focusReturn.restore();
    expect(document.activeElement).toBe(other);
  });

  test("restore() is a no-op when activeElement was not an HTMLElement at save time", () => {
    // No HTMLElement focused: document.activeElement is <body>.
    (document.activeElement as HTMLElement | null)?.blur();

    const focusReturn = restoreFocus();
    focusReturn.save();

    const other = document.createElement("button");
    document.body.appendChild(other);
    other.focus();

    focusReturn.restore();
    expect(document.activeElement).toBe(other);
  });
});
