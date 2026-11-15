import { createFocusOpener } from "../../src/ListBox/open-on-focus.js";

describe("createFocusOpener", () => {
  const inside = document.createElement("button");
  const outside = document.createElement("button");
  const input = document.createElement("input");
  const opener = () => createFocusOpener((node) => node === inside);
  const focus = (relatedTarget: EventTarget | null) =>
    new FocusEvent("focus", { relatedTarget });
  const blur = (relatedTarget: EventTarget | null) => {
    const event = new FocusEvent("blur", { relatedTarget });
    Object.defineProperty(event, "target", { value: input });
    return event;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("counts focus from outside and ignores focus from inside", () => {
    const { focus: arrived } = opener();
    expect(arrived(focus(outside))).toBe(true);
    expect(arrived(focus(null))).toBe(true);
    expect(arrived(focus(inside))).toBe(false);
  });

  it("ignores the window regaining focus, once", () => {
    const { focus: arrived, blur: left } = opener();
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    left(blur(null));
    vi.spyOn(document, "hasFocus").mockReturnValue(true);

    expect(arrived(focus(null))).toBe(false);
    expect(arrived(focus(null))).toBe(true);
  });
});
