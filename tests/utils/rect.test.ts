import { rect } from "./rect";

describe("rect", () => {
  it("throws when an edge and a size disagree", () => {
    expect(() => rect({ top: 0, bottom: 50, height: 40 })).toThrow(/bottom/);
  });
});
