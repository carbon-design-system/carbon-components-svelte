import {
  disposeCaretMirror,
  getCaretCoordinates,
} from "../../src/Mentions/caret-position.js";

describe("getCaretCoordinates", () => {
  it("builds one hidden mirror that takes the field's text styles, and removes it", () => {
    const field = document.createElement("textarea");
    field.style.direction = "rtl";
    field.style.fontSize = "20px";
    field.value = "hello @ali";
    document.body.append(field);

    getCaretCoordinates(field, 6);
    getCaretCoordinates(field, 6);

    const mirrors = document.querySelectorAll("body > div[aria-hidden]");
    expect(mirrors).toHaveLength(1);
    const mirror = mirrors[0] as HTMLElement;
    expect(mirror.style.direction).toBe("rtl");
    expect(mirror.style.fontSize).toBe("20px");
    expect(mirror.style.visibility).toBe("hidden");
    expect(mirror.style.whiteSpace).toBe("pre-wrap");
    // The text before the caret, then a marker that carries the rest.
    expect(mirror.textContent).toBe("hello @ali");

    disposeCaretMirror(field);
    expect(document.querySelectorAll("body > div[aria-hidden]")).toHaveLength(
      0,
    );
    field.remove();
  });

  it("does not wrap an input's text", () => {
    const input = document.createElement("input");
    input.value = "a b";
    document.body.append(input);
    getCaretCoordinates(input, 3);
    const mirror = document.querySelector(
      "body > div[aria-hidden]",
    ) as HTMLElement;
    expect(mirror.style.whiteSpace).toBe("pre");
    disposeCaretMirror(input);
    input.remove();
  });
});
