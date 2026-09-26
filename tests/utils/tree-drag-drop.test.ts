import {
  computeDropPosition,
  isDescendant,
  isValidDropTarget,
} from "../../src/utils/tree-drag-drop.js";

const ROOT = Symbol("root");

// analytics
//   engine
//     spark
//   sql-query
// blockchain
const parentIdById = new Map<string, string | symbol>([
  ["analytics", ROOT],
  ["engine", "analytics"],
  ["spark", "engine"],
  ["sql-query", "analytics"],
  ["blockchain", ROOT],
]);

describe("computeDropPosition", () => {
  const rect = { top: 100, height: 30 };

  test("top third resolves to before", () => {
    expect(computeDropPosition(105, rect)).toBe("before");
  });

  test("middle third resolves to inside", () => {
    expect(computeDropPosition(115, rect)).toBe("inside");
  });

  test("bottom third resolves to after", () => {
    expect(computeDropPosition(125, rect)).toBe("after");
  });
});

describe("isDescendant", () => {
  test("true for a direct child", () => {
    expect(isDescendant("engine", "analytics", parentIdById)).toBe(true);
  });

  test("true for a deeper descendant", () => {
    expect(isDescendant("spark", "analytics", parentIdById)).toBe(true);
  });

  test("false for a sibling", () => {
    expect(isDescendant("sql-query", "engine", parentIdById)).toBe(false);
  });

  test("false for an unrelated top-level node", () => {
    expect(isDescendant("blockchain", "analytics", parentIdById)).toBe(false);
  });

  test("false for the node itself", () => {
    expect(isDescendant("analytics", "analytics", parentIdById)).toBe(false);
  });
});

describe("isValidDropTarget", () => {
  test("false when the target is the dragged node itself", () => {
    expect(isValidDropTarget("analytics", "analytics", parentIdById)).toBe(
      false,
    );
  });

  test("false when the target is a descendant of the dragged node", () => {
    expect(isValidDropTarget("analytics", "spark", parentIdById)).toBe(false);
  });

  test("true for an unrelated node", () => {
    expect(isValidDropTarget("analytics", "blockchain", parentIdById)).toBe(
      true,
    );
  });

  test("true for the dragged node's own parent (moving back to before/after it)", () => {
    expect(isValidDropTarget("spark", "engine", parentIdById)).toBe(true);
  });
});
