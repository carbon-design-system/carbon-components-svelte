import { rect } from "./rect";

describe("rect", () => {
  it("derives the size from opposite edges", () => {
    expect(rect({ top: 10, bottom: 110 }).toJSON()).toEqual(
      new DOMRect(0, 10, 0, 100).toJSON(),
    );
  });

  it("derives the far edges from the size", () => {
    const r = rect({ left: 5, width: 20, height: 30 });
    expect([r.right, r.bottom]).toEqual([25, 30]);
  });

  it("throws when an edge and a size disagree", () => {
    expect(() => rect({ top: 0, bottom: 50, height: 40 })).toThrow(/bottom/);
  });
});
