import {
  initialFocus,
  restoreFocus,
  returnFocus,
} from "../../src/utils/focus.js";

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
  it("returns the selectorPrimaryFocus match when present", () => {
    const container = setup(`
      <input />
      <button data-modal-primary-focus>Primary</button>
    `);
    const expected = container.querySelector("[data-modal-primary-focus]");

    expect(initialFocus({ container })).toBe(expected);
  });

  it("falls back to the first form input", () => {
    const container = setup(`
      <input id="first" />
      <input id="second" />
    `);

    expect(initialFocus({ container })).toBe(container.querySelector("#first"));
  });

  it("falls back to the first truthy fallbacks candidate", () => {
    const container = setup("<p>No focusable selector or input</p>");
    const closeButton = document.createElement("button");

    expect(
      initialFocus({ container, fallbacks: [null, undefined, closeButton] }),
    ).toBe(closeButton);
  });

  it("returns null when selectorPrimaryFocus is null", () => {
    const container = setup("<input />");

    expect(initialFocus({ container, selectorPrimaryFocus: null })).toBeNull();
  });

  it("returns null when container is null", () => {
    expect(initialFocus({ container: null })).toBeNull();
  });

  it("returns null when nothing matches", () => {
    const container = setup("<p>Nothing focusable</p>");

    expect(initialFocus({ container })).toBeNull();
  });
});

describe("restoreFocus", () => {
  it("save() then restore() returns focus to the saved element", () => {
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

  it("restore() is a no-op when the saved element was removed from the DOM", () => {
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

  it("restore() is a no-op when activeElement was not an HTMLElement at save time", () => {
    // No HTMLElement focused: document.activeElement is <body>.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const focusReturn = restoreFocus();
    focusReturn.save();

    const other = document.createElement("button");
    document.body.appendChild(other);
    other.focus();

    focusReturn.restore();
    expect(document.activeElement).toBe(other);
  });
});

describe("restoreFocus with a region", () => {
  it("restores when focus is still inside the region", () => {
    const container = setup(`
      <button id="trigger"></button>
      <div id="dialog"><button id="inside"></button></div>
    `);
    const trigger = container.querySelector<HTMLElement>("#trigger");
    trigger?.focus();
    const focusReturn = restoreFocus();
    focusReturn.save();
    container.querySelector<HTMLElement>("#inside")?.focus();

    focusReturn.restore(container.querySelector("#dialog"));
    expect(document.activeElement).toBe(trigger);
  });

  it("skips the restore when focus moved outside the region", () => {
    const container = setup(`
      <button id="trigger"></button>
      <div id="dialog"><button id="inside"></button></div>
      <input id="elsewhere" />
    `);
    container.querySelector<HTMLElement>("#trigger")?.focus();
    const focusReturn = restoreFocus();
    focusReturn.save();
    const elsewhere = container.querySelector<HTMLElement>("#elsewhere");
    elsewhere?.focus();

    focusReturn.restore(container.querySelector("#dialog"));
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("returnFocus", () => {
  it("focuses the target when focus was dropped to <body>", () => {
    const container = setup('<button id="trigger"></button>');
    const trigger = container.querySelector<HTMLElement>("#trigger");

    returnFocus(trigger);
    expect(document.activeElement).toBe(trigger);
  });

  it("focuses the target when focus is still inside the region", () => {
    const container = setup(`
      <button id="trigger"></button>
      <div id="menu"><button id="item"></button></div>
    `);
    const trigger = container.querySelector<HTMLElement>("#trigger");
    container.querySelector<HTMLElement>("#item")?.focus();

    returnFocus(trigger, container.querySelector("#menu"));
    expect(document.activeElement).toBe(trigger);
  });

  it("leaves focus alone when it moved outside the region", () => {
    const container = setup(`
      <button id="trigger"></button>
      <div id="menu"><button id="item"></button></div>
      <input id="elsewhere" />
    `);
    const elsewhere = container.querySelector<HTMLElement>("#elsewhere");
    elsewhere?.focus();

    returnFocus(
      container.querySelector<HTMLElement>("#trigger"),
      container.querySelector("#menu"),
    );
    expect(document.activeElement).toBe(elsewhere);
  });

  it("is a no-op when the target is disconnected or missing", () => {
    const detached = document.createElement("button");

    returnFocus(detached);
    returnFocus(null);
    expect(document.activeElement).toBe(document.body);
  });
});
