// @vitest-environment node
import {
  applyNumberEdit,
  createScrub,
  keyDelta,
  parseNumberEdit,
  scaleLinked,
} from "../../src/PropertyInspector/number-edit.js";

describe("parseNumberEdit", () => {
  it.each([
    ["12", { kind: "set", n: 12 }],
    ["=12", { kind: "set", n: 12 }],
    ["-5", { kind: "set", n: -5 }],
    ["−5", { kind: "set", n: -5 }],
    ["1,5", { kind: "set", n: 1.5 }],
    ["+10", { kind: "add", n: 10 }],
    ["+ 10", { kind: "add", n: 10 }],
    ["+-4", { kind: "add", n: -4 }],
    ["*2", { kind: "multiply", n: 2 }],
    ["x1.5", { kind: "multiply", n: 1.5 }],
  ])("reads %s", (text, edit) => {
    expect(parseNumberEdit(text)).toEqual(edit);
  });

  it("ignores a trailing unit", () => {
    expect(parseNumberEdit("+10px", "px")).toEqual({ kind: "add", n: 10 });
    expect(parseNumberEdit("50 %", "%")).toEqual({ kind: "set", n: 50 });
  });

  it.each(["", "abc", "+", "1+1", "--3", "12abc"])("rejects %j", (text) => {
    expect(parseNumberEdit(text)).toBeNull();
  });
});

describe("applyNumberEdit", () => {
  it("adds to and scales each object's own value", () => {
    expect(applyNumberEdit({ kind: "add", n: 10 }, 5)).toBe(15);
    expect(applyNumberEdit({ kind: "multiply", n: 2 }, 5)).toBe(10);
    expect(applyNumberEdit({ kind: "set", n: 3 }, 5)).toBe(3);
  });

  it("clamps to the limits", () => {
    expect(applyNumberEdit({ kind: "add", n: 50 }, 80, { max: 100 })).toBe(100);
    expect(applyNumberEdit({ kind: "add", n: -50 }, 20, { min: 0 })).toBe(0);
  });

  it("rounds away float noise", () => {
    expect(applyNumberEdit({ kind: "add", n: 0.2 }, 0.1)).toBe(0.3);
    expect(applyNumberEdit({ kind: "add", n: 0.1 }, 0.7, { step: 0.1 })).toBe(
      0.8,
    );
  });
});

describe("keyDelta", () => {
  it("steps by one, ten with Shift, a tenth with Alt", () => {
    expect(keyDelta("ArrowUp", { step: 1 })).toBe(1);
    expect(keyDelta("ArrowDown", { step: 1, shiftKey: true })).toBe(-10);
    expect(keyDelta("ArrowUp", { step: 1, altKey: true })).toBe(0.1);
  });

  it("moves ten steps on the page keys", () => {
    expect(keyDelta("PageUp", { step: 2 })).toBe(20);
    expect(keyDelta("PageDown", { step: 2 })).toBe(-20);
  });

  it("is 0 for other keys", () => {
    expect(keyDelta("a", { step: 1 })).toBe(0);
  });
});

describe("createScrub", () => {
  it("adds one step per 4 pixels, keeping the remainder", () => {
    const scrub = createScrub({ step: 1 });
    expect(scrub.move(3)).toBe(0);
    expect(scrub.move(3)).toBe(1);
    expect(scrub.move(2)).toBe(2);
  });

  it("goes back down", () => {
    const scrub = createScrub({ step: 1 });
    scrub.move(20);
    expect(scrub.move(-8)).toBe(3);
  });

  it("moves ten steps with Shift", () => {
    const scrub = createScrub({ step: 1 });
    expect(scrub.move(4, { shiftKey: true })).toBe(10);
  });

  it("raises the value toward the inline end in a right-to-left layout", () => {
    const scrub = createScrub({ step: 1, sign: -1 });
    expect(scrub.move(-8)).toBe(2);
    expect(scrub.move(8)).toBe(0);
  });

  it("does not drift with a fractional step", () => {
    const scrub = createScrub({ step: 0.1 });
    for (let index = 0; index < 3; index++) scrub.move(4);
    expect(scrub.move(0)).toBe(0.3);
  });
});

describe("scaleLinked", () => {
  it("keeps the ratio", () => {
    expect(scaleLinked(100, 150, 40)).toBe(60);
  });

  it("leaves the linked value when the primary was 0", () => {
    expect(scaleLinked(0, 10, 40)).toBe(40);
  });
});
