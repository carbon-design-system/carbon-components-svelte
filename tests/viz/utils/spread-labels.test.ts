import { spreadLabels } from "../../../src/viz/utils/spread-labels.js";

describe("spreadLabels", () => {
  test("leaves labels that already fit alone", () => {
    expect(spreadLabels([10, 40, 90], 14, 0, 100)).toEqual([10, 40, 90]);
  });

  test("pushes a cluster apart around its middle, keeping the order", () => {
    expect(spreadLabels([50, 52, 48], 10, 0, 100)).toEqual([50, 60, 40]);
  });

  test("keeps the pile inside the range", () => {
    expect(spreadLabels([98, 99, 100], 10, 0, 100)).toEqual([80, 90, 100]);
    expect(spreadLabels([0, 1, 2], 10, 0, 100)).toEqual([0, 10, 20]);
  });

  test("packs from the start when the range is too small", () => {
    expect(spreadLabels([5, 3, 4], 10, 0, 15)).toEqual([20, 0, 10]);
  });
});
