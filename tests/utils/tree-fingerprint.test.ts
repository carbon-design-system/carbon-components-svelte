import {
  fingerprintTree,
  matchesFingerprint,
} from "../../src/utils/tree-fingerprint.js";

describe("fingerprintTree / matchesFingerprint", () => {
  it("matches a tree that has not changed", () => {
    const tree = [
      { id: "a", text: "Alpha", nodes: [{ id: "a1", text: "Alpha 1" }] },
      { id: "b", text: "Beta" },
    ];
    const fingerprint = fingerprintTree(tree);

    expect(matchesFingerprint(fingerprint, tree)).toBe(true);
  });

  it("does not match after a field is mutated in place", () => {
    const tree = [{ id: "a", text: "Alpha" }];
    const fingerprint = fingerprintTree(tree);

    tree[0].text = "Alpha Updated";

    expect(matchesFingerprint(fingerprint, tree)).toBe(false);
  });

  it("does not match after a nested child is mutated in place", () => {
    const tree = [{ id: "a", nodes: [{ id: "a1", text: "Alpha 1" }] }];
    const fingerprint = fingerprintTree(tree);

    tree[0].nodes[0].text = "Alpha 1 Updated";

    expect(matchesFingerprint(fingerprint, tree)).toBe(false);
  });

  it("does not match a newly lazy-loaded subtree", () => {
    const parent: { id: string; nodes?: Array<{ id: string }> } = {
      id: "p",
    };
    const tree = [parent];
    const fingerprint = fingerprintTree(tree);

    parent.nodes = [{ id: "c1" }];

    expect(matchesFingerprint(fingerprint, tree)).toBe(false);
  });

  it("does not match when a node is added or removed", () => {
    const tree = [{ id: "a" }, { id: "b" }];
    const fingerprint = fingerprintTree(tree);

    expect(matchesFingerprint(fingerprint, [{ id: "a" }])).toBe(false);
    expect(matchesFingerprint(fingerprint, [...tree, { id: "c" }])).toBe(false);
  });

  it("does not match a field compared by identity, even if it looks equal", () => {
    const formatA = () => "a";
    const tree = [{ id: "a", format: formatA }];
    const fingerprint = fingerprintTree(tree);

    // A different function that returns the same thing is still "changed":
    // the snapshot compares by `Object.is`, not by calling it.
    tree[0].format = () => "a";

    expect(matchesFingerprint(fingerprint, tree)).toBe(false);
  });

  it("matches an empty tree", () => {
    expect(matchesFingerprint(fingerprintTree([]), [])).toBe(true);
  });
});
