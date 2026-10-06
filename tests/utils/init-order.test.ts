// @vitest-environment node
import { createInitOrder } from "../../src/utils/init-order.js";

describe("createInitOrder", () => {
  it("returns positions in claim order", () => {
    const order = createInitOrder<string>();

    expect(order.claim("a")).toBe(0);
    expect(order.claim("b")).toBe(1);
    expect(order.claim("c")).toBe(2);
  });

  it("looks up a claimed item by position", () => {
    const order = createInitOrder<{ id: string }>();
    order.claim({ id: "a" });
    order.claim({ id: "b" });

    expect(order.at(1)).toEqual({ id: "b" });
    expect(order.at(2)).toBeUndefined();
  });

  it("stops handing out positions once closed", () => {
    const order = createInitOrder<string>();
    order.claim("a");
    order.close();

    expect(order.claim("b")).toBeUndefined();
    expect(order.at(0)).toBeUndefined();
  });
});
