import { isOutsideClick } from "../../src/utils/isOutsideClick.js";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  const box = document.createElement("div");
  const inside = document.createElement("button");
  box.appendChild(inside);
  const outside = document.createElement("button");
  document.body.append(box, outside);
  return { box, inside, outside };
}

function clickOn(target: Element) {
  return { target } as unknown as Event;
}

describe("isOutsideClick", () => {
  test("false when the target is inside the only element", () => {
    const { box, inside } = setup();
    expect(isOutsideClick(clickOn(inside), box)).toBe(false);
    expect(isOutsideClick(clickOn(box), box)).toBe(false);
  });

  test("true when the target is outside the element", () => {
    const { box, outside } = setup();
    expect(isOutsideClick(clickOn(outside), box)).toBe(true);
  });

  test("false when any element in the list contains the target", () => {
    const { box, inside, outside } = setup();
    expect(isOutsideClick(clickOn(inside), [outside, box])).toBe(false);
  });

  test("skips falsy entries", () => {
    const { box, outside } = setup();
    expect(
      isOutsideClick(clickOn(outside), [null, undefined, false, box]),
    ).toBe(true);
    expect(isOutsideClick(clickOn(outside), [false && box])).toBe(true);
  });

  // Non-Node targets must not count as outside (overlays should not dismiss).
  test("false when the target is not a Node", () => {
    const { box } = setup();
    expect(isOutsideClick({ target: null } as unknown as Event, box)).toBe(
      false,
    );
    expect(isOutsideClick({ target: window } as unknown as Event, box)).toBe(
      false,
    );
  });

  test("single element and one-element array behave the same", () => {
    const { box, inside, outside } = setup();
    expect(isOutsideClick(clickOn(inside), box)).toBe(
      isOutsideClick(clickOn(inside), [box]),
    );
    expect(isOutsideClick(clickOn(outside), box)).toBe(
      isOutsideClick(clickOn(outside), [box]),
    );
  });

  test("true for an empty list", () => {
    const { outside } = setup();
    expect(isOutsideClick(clickOn(outside), [])).toBe(true);
  });

  // event.target is the shadow host for listeners outside the shadow root.
  // element.contains(host) is then false even when the click was inside.
  // composedPath() still includes the real node.
  test("false when the true target is inside via composedPath, even if event.target is retargeted to the shadow host", () => {
    const shadowHost = document.createElement("div");
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: "open" });
    const box = document.createElement("div");
    const innerButton = document.createElement("button");
    box.appendChild(innerButton);
    shadowRoot.appendChild(box);

    const event = {
      target: shadowHost,
      composedPath: () => [
        innerButton,
        box,
        shadowRoot,
        shadowHost,
        document.body,
      ],
    } as unknown as Event;

    expect(isOutsideClick(event, box)).toBe(false);
  });

  test("true via composedPath when the true target is genuinely outside", () => {
    const { box, outside } = setup();
    const event = {
      target: outside,
      composedPath: () => [outside, document.body],
    } as unknown as Event;

    expect(isOutsideClick(event, box)).toBe(true);
  });
});
