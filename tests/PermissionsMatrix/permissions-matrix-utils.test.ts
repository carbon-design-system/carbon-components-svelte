// @vitest-environment node
import {
  applyEdits,
  cellKey,
  changedKeys,
  diffValues,
  fixedWindow,
  flattenPermissions,
  groupTarget,
  lockReason,
  moveCell,
  nextLevel,
  normalizeLevels,
  orderRoles,
  paintedIndexes,
  resolveMatrix,
  revealOffset,
  rollup,
  setLeafEdit,
  toLevelIndex,
  visibleNodes,
} from "../../src/PermissionsMatrix/permissions-matrix-utils.js";

const permissions = [
  {
    id: "billing",
    label: "Billing",
    children: [
      { id: "billing.view", label: "View invoices" },
      { id: "billing.pay", label: "Pay invoices" },
    ],
  },
  {
    id: "team",
    label: "Team",
    children: [
      { id: "team.view", label: "View members" },
      {
        id: "team.manage",
        label: "Manage",
        children: [
          { id: "team.invite", label: "Invite" },
          { id: "team.remove", label: "Remove" },
        ],
      },
    ],
  },
  { id: "audit", label: "Audit log" },
];

const tree = flattenPermissions(permissions);

describe("flattenPermissions", () => {
  it("lists nodes in tree order with the leaves of each group contiguous", () => {
    expect(tree.nodes.map((n) => n.id)).toEqual([
      "billing",
      "billing.view",
      "billing.pay",
      "team",
      "team.view",
      "team.manage",
      "team.invite",
      "team.remove",
      "audit",
    ]);
    expect(tree.leaves.map((n) => n.id)).toEqual([
      "billing.view",
      "billing.pay",
      "team.view",
      "team.invite",
      "team.remove",
      "audit",
    ]);
    const team = tree.nodes[3];
    expect([team.leafStart, team.leafEnd, team.end]).toEqual([2, 5, 8]);
    expect(tree.nodes[6].path).toEqual(["Team", "Manage", "Invite"]);
  });

  it("treats a node with an empty children list as a leaf", () => {
    const flat = flattenPermissions([{ id: "x", label: "X", children: [] }]);
    expect(flat.nodes[0].group).toBe(false);
    expect(flat.leaves).toHaveLength(1);
  });
});

describe("visibleNodes", () => {
  it("hides the descendants of a collapsed group, however deep", () => {
    expect(
      visibleNodes(tree.nodes, new Set(["team"])).map((n) => n.id),
    ).toEqual(["billing", "billing.view", "billing.pay", "team", "audit"]);
    expect(
      visibleNodes(tree.nodes, new Set(["team.manage"])).map((n) => n.id),
    ).toContain("team.manage");
    expect(
      visibleNodes(tree.nodes, new Set(["team.manage"])).map((n) => n.id),
    ).not.toContain("team.invite");
  });
});

describe("orderRoles", () => {
  it("puts every parent before its children", () => {
    const roles = [
      { id: "admin", label: "Admin", parent: "editor" },
      { id: "editor", label: "Editor", parent: "viewer" },
      { id: "viewer", label: "Viewer" },
    ];
    const { order, depth } = orderRoles(roles);
    expect(order.map((i) => roles[i].id)).toEqual([
      "viewer",
      "editor",
      "admin",
    ]);
    expect(depth).toEqual([2, 1, 0]);
  });

  it("resolves an unknown parent and a cycle as roots instead of looping", () => {
    const roles = [
      { id: "a", label: "A", parent: "b" },
      { id: "b", label: "B", parent: "a" },
      { id: "c", label: "C", parent: "missing" },
      { id: "d", label: "D", parent: "d" },
    ];
    const { order, parentIndex, cyclic } = orderRoles(roles);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
    expect(parentIndex[2]).toBe(-1);
    expect(parentIndex[3]).toBe(-1);
    expect(cyclic).toHaveLength(1);
    expect(parentIndex.filter((p) => p === -1).length).toBeGreaterThanOrEqual(
      3,
    );
  });
});

describe("resolveMatrix", () => {
  const roles = [
    { id: "viewer", label: "Viewer" },
    { id: "editor", label: "Editor", parent: "viewer" },
    { id: "admin", label: "Admin", parent: "editor" },
  ];
  const roleOrder = orderRoles(roles);
  const leaf = (id: string) => tree.leafIndexById.get(id) as number;

  it("takes the parent's value unless the role sets its own", () => {
    const resolved = resolveMatrix({
      roles,
      roleOrder,
      permissions: tree,
      levels: null,
      values: {
        viewer: { "billing.view": true, audit: true },
        editor: { "billing.pay": true, audit: false },
      },
    });
    const [viewer, editor, admin] = resolved.levels;
    expect(viewer[leaf("billing.view")]).toBe(1);
    expect(editor[leaf("billing.view")]).toBe(1);
    expect(admin[leaf("billing.view")]).toBe(1);
    expect(editor[leaf("billing.pay")]).toBe(1);
    expect(viewer[leaf("billing.pay")]).toBe(0);
    // The editor revokes what the viewer has; the admin inherits the revoke.
    expect(editor[leaf("audit")]).toBe(0);
    expect(admin[leaf("audit")]).toBe(0);
  });

  it("records where each value comes from", () => {
    const resolved = resolveMatrix({
      roles,
      roleOrder,
      permissions: tree,
      levels: null,
      values: { viewer: { "billing.view": true }, editor: { audit: true } },
    });
    expect(resolved.from[2][leaf("billing.view")]).toBe(0);
    expect(resolved.from[2][leaf("audit")]).toBe(1);
    expect(resolved.from[2][leaf("team.view")]).toBe(-1);
    expect(resolved.explicit[1][leaf("audit")]).toBe(1);
    expect(resolved.explicit[2][leaf("audit")]).toBe(-1);
  });

  it("resolves levels by id and ignores unknown permissions and levels", () => {
    const levels = normalizeLevels(["none", "read", "write", "admin"]);
    const resolved = resolveMatrix({
      roles,
      roleOrder,
      permissions: tree,
      levels,
      values: {
        viewer: { "billing.view": "read", nope: "write", audit: "bogus" },
        editor: { "billing.view": "write" },
      },
    });
    expect(resolved.levels[0][leaf("billing.view")]).toBe(1);
    expect(resolved.levels[1][leaf("billing.view")]).toBe(2);
    expect(resolved.levels[2][leaf("billing.view")]).toBe(2);
    expect(resolved.levels[0][leaf("audit")]).toBe(0);
  });

  it("resolves a role in a cycle without hanging", () => {
    const looped = [
      { id: "a", label: "A", parent: "b" },
      { id: "b", label: "B", parent: "a" },
    ];
    const resolved = resolveMatrix({
      roles: looped,
      roleOrder: orderRoles(looped),
      permissions: tree,
      levels: null,
      values: { a: { audit: true } },
    });
    expect(resolved.levels).toHaveLength(2);
  });
});

describe("levels", () => {
  it("treats fewer than two levels as a boolean matrix", () => {
    expect(normalizeLevels(undefined)).toBeNull();
    expect(normalizeLevels(["only"])).toBeNull();
    expect(normalizeLevels(["a", { id: "b", label: "B" }])).toEqual([
      { id: "a", label: "a" },
      { id: "b", label: "B" },
    ]);
  });

  it("maps booleans to two levels and ids to their position", () => {
    expect(toLevelIndex(true, null)).toBe(1);
    expect(toLevelIndex(false, null)).toBe(0);
    expect(toLevelIndex(undefined, null)).toBe(-1);
    expect(toLevelIndex("write", normalizeLevels(["a", "write"]))).toBe(1);
  });

  it("wraps when stepping either way", () => {
    expect(nextLevel(3, 4)).toBe(0);
    expect(nextLevel(0, 4, -1)).toBe(3);
  });
});

describe("rollup and groupTarget", () => {
  const levels = Int8Array.from([1, 1, 0, 1, 1, 1]);

  it("is uniform only when every leaf in the range shares a level", () => {
    expect(rollup(levels, 0, 2)).toEqual({ uniform: true, level: 1 });
    expect(rollup(levels, 0, 3)).toEqual({ uniform: false, level: -1 });
    expect(rollup(levels, 3, 3)).toEqual({ uniform: true, level: 0 });
  });

  it("grants a mixed group and clears a fully granted one", () => {
    expect(groupTarget(levels, [0, 1, 2], 2)).toBe(1);
    expect(groupTarget(levels, [0, 1], 2)).toBe(0);
    expect(groupTarget(levels, [2], 2)).toBe(1);
  });

  it("jumps a mixed level group to the top, then steps a uniform one", () => {
    const four = Int8Array.from([0, 2, 2]);
    expect(groupTarget(four, [0, 1], 4)).toBe(3);
    expect(groupTarget(four, [1, 2], 4)).toBe(3);
    expect(groupTarget(Int8Array.from([3, 3]), [0, 1], 4)).toBe(0);
  });

  it("does nothing useful on a group with no editable leaf", () => {
    expect(groupTarget(levels, [], 2)).toBe(1);
  });
});

describe("lockReason", () => {
  const role = { id: "r", label: "R" };
  const permission = { id: "p", label: "P" };

  it("prefers the permission, then the role, then the callback", () => {
    expect(
      lockReason(role, { ...permission, locked: "SOC 2" }, undefined),
    ).toBe("SOC 2");
    expect(
      lockReason({ ...role, locked: "Managed" }, permission, () => "no"),
    ).toBe("Managed");
    expect(lockReason(role, permission, () => "Policy")).toBe("Policy");
  });

  it("returns an empty reason for a bare lock, and null when free", () => {
    expect(lockReason({ ...role, locked: true }, permission, undefined)).toBe(
      "",
    );
    expect(lockReason(role, permission, () => false)).toBeNull();
    expect(lockReason(role, permission, undefined)).toBeNull();
  });

  it("hands the callback the consumer's own permission object", () => {
    const item = { id: "p", label: "P", custom: 1 };
    const callback = vi.fn();
    lockReason(role, { ...permission, item }, callback);
    expect(callback).toHaveBeenCalledWith(role, item);
  });
});

describe("applyEdits and setLeafEdit", () => {
  const values = { viewer: { a: true }, editor: { b: true } };

  it("does not mutate its input, and keeps untouched roles by identity", () => {
    const next = applyEdits(values, [
      { roleId: "viewer", permissionId: "c", value: true },
    ]);
    expect(values.viewer).toEqual({ a: true });
    expect(next.viewer).toEqual({ a: true, c: true });
    expect(next.editor).toBe(values.editor);
  });

  it("drops a role left with no entries", () => {
    const next = applyEdits(values, [
      { roleId: "editor", permissionId: "b", value: undefined },
    ]);
    expect("editor" in next).toBe(false);
  });

  it("removes the entry when the level is what the role would inherit", () => {
    expect(
      setLeafEdit({
        roleId: "editor",
        permissionId: "x",
        level: 1,
        inheritedLevel: 1,
        levels: null,
      }).value,
    ).toBeUndefined();
    expect(
      setLeafEdit({
        roleId: "editor",
        permissionId: "x",
        level: 0,
        inheritedLevel: 1,
        levels: null,
      }).value,
    ).toBe(false);
    expect(
      setLeafEdit({
        roleId: "editor",
        permissionId: "x",
        level: 2,
        inheritedLevel: 1,
        levels: normalizeLevels(["none", "read", "write"]),
      }).value,
    ).toBe("write");
  });
});

describe("diffValues", () => {
  it("lists added, changed and removed entries, and nothing for equal ones", () => {
    const changes = diffValues(
      { viewer: { a: true, b: true }, editor: { c: true } },
      { viewer: { a: false, d: true }, editor: { c: true } },
    );
    expect(changes).toEqual(
      expect.arrayContaining([
        { roleId: "viewer", permissionId: "a", from: true, to: false },
        { roleId: "viewer", permissionId: "b", from: true, to: undefined },
        { roleId: "viewer", permissionId: "d", from: undefined, to: true },
      ]),
    );
    expect(changes).toHaveLength(3);
  });

  it("finds a role that exists on one side only", () => {
    expect(diffValues({}, { admin: { a: "write" } })).toEqual([
      { roleId: "admin", permissionId: "a", from: undefined, to: "write" },
    ]);
    expect(diffValues({ admin: { a: "write" } }, {})).toHaveLength(1);
  });

  it("keys a change by role and permission", () => {
    const keys = changedKeys(diffValues({}, { viewer: { a: true } }));
    expect(keys.has(cellKey("viewer", "a"))).toBe(true);
    expect(keys.has(cellKey("viewer", "b"))).toBe(false);
  });
});

describe("moveCell", () => {
  const grid = { rows: 5, cols: 4, page: 3 };

  it("moves one cell and stops at the edges", () => {
    expect(moveCell({ row: 1, col: 1 }, "ArrowDown", grid)).toEqual({
      row: 2,
      col: 1,
    });
    expect(moveCell({ row: 4, col: 3 }, "ArrowDown", grid)).toEqual({
      row: 4,
      col: 3,
    });
    expect(moveCell({ row: 0, col: 0 }, "ArrowLeft", grid)).toEqual({
      row: 0,
      col: 0,
    });
  });

  it("swaps the horizontal arrows in RTL", () => {
    expect(
      moveCell({ row: 1, col: 1 }, "ArrowRight", { ...grid, rtl: true }),
    ).toEqual({ row: 1, col: 0 });
    expect(
      moveCell({ row: 1, col: 1 }, "ArrowRight", {
        ...grid,
        rtl: true,
        ctrl: true,
      }),
    ).toEqual({ row: 1, col: 0 });
  });

  it("jumps with Home, End and the page keys", () => {
    expect(moveCell({ row: 2, col: 2 }, "Home", grid)).toEqual({
      row: 2,
      col: 0,
    });
    expect(
      moveCell({ row: 2, col: 2 }, "End", { ...grid, ctrl: true }),
    ).toEqual({ row: 4, col: 3 });
    expect(moveCell({ row: 1, col: 1 }, "PageDown", grid)).toEqual({
      row: 4,
      col: 1,
    });
    expect(moveCell({ row: 1, col: 1 }, "PageUp", grid)).toEqual({
      row: 0,
      col: 1,
    });
  });

  it("returns null for a key that does not move", () => {
    expect(moveCell({ row: 1, col: 1 }, "a", grid)).toBeNull();
  });
});

describe("painted window", () => {
  it("paints the viewport plus overscan, clamped to the count", () => {
    expect(
      fixedWindow({ offset: 320, viewport: 160, size: 32, count: 300 }),
    ).toEqual({ start: 7, end: 18 });
    expect(
      fixedWindow({ offset: 0, viewport: 160, size: 32, count: 4 }),
    ).toEqual({ start: 0, end: 4 });
    expect(
      fixedWindow({ offset: 0, viewport: 100, size: 32, count: 0 }),
    ).toEqual({ start: 0, end: 0 });
  });

  it("paints further ahead on the side the scroll is heading for", () => {
    const base = { offset: 3200, viewport: 160, size: 32, count: 300 };
    const still = fixedWindow(base);
    const down = fixedWindow({ ...base, delta: 128 });
    const up = fixedWindow({ ...base, delta: -128 });
    expect(down.start).toBe(still.start);
    expect(down.end).toBeGreaterThan(still.end);
    expect(up.end).toBe(still.end);
    expect(up.start).toBeLessThan(still.start);
    expect(fixedWindow({ ...base, offset: 0, delta: -9999 }).start).toBe(0);
  });

  it("scrolls the least that brings an item into view", () => {
    const view = { size: 32, offset: 100, viewport: 200 };
    expect(revealOffset({ ...view, start: 120 })).toBe(100);
    expect(revealOffset({ ...view, start: 40 })).toBe(40);
    expect(revealOffset({ ...view, start: 400 })).toBe(232);
  });

  it("keeps the active item painted outside the window, with its gap", () => {
    expect(paintedIndexes(5, 8, 1)).toEqual([
      { index: 1, gap: 1 },
      { index: 5, gap: 3 },
      { index: 6, gap: 0 },
      { index: 7, gap: 0 },
    ]);
    expect(paintedIndexes(5, 7, 20)).toEqual([
      { index: 5, gap: 5 },
      { index: 6, gap: 0 },
      { index: 20, gap: 13 },
    ]);
    expect(paintedIndexes(0, 2, 1)).toEqual([
      { index: 0, gap: 0 },
      { index: 1, gap: 0 },
    ]);
  });
});
