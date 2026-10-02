import { render } from "@testing-library/svelte";
import TreeView from "../../src/TreeView/TreeView.svelte";
import type * as IdMembershipStoreModule from "../../src/utils/id-membership-store.js";
import { treeItemById } from "../utils/tree-item-by-id";
import { user } from "../utils/user";

/** Row-store notifications after the initial subscribe call. */
let notifications = 0;

vi.mock("../../src/utils/id-membership-store.js", async (importOriginal) => {
  const mod = await importOriginal<typeof IdMembershipStoreModule>();
  return {
    ...mod,
    createIdMembershipStore: (
      ...args: Parameters<typeof mod.createIdMembershipStore>
    ) => {
      const store = mod.createIdMembershipStore(...args);
      return {
        ...store,
        select: (id: Parameters<typeof store.select>[0]) => ({
          subscribe: (callback: (value: boolean) => void) => {
            let initial = true;
            return store.select(id).subscribe((value) => {
              if (!initial) notifications++;
              initial = false;
              callback(value);
            });
          },
        }),
      };
    },
  };
});

describe("TreeView row notifications", () => {
  it("notifies only the rows whose state changed on selection", async () => {
    const nodes = Array.from({ length: 50 }, (_, id) => ({
      id,
      text: `Row ${id}`,
    }));
    render(TreeView, { nodes, activeId: 0, selectedIds: [0] });
    notifications = 0;

    await user.click(treeItemById(40));

    expect(treeItemById(40)).toHaveAttribute("aria-selected", "true");
    // Row 0 loses active + selected; row 40 gains them.
    expect(notifications).toBe(4);
  });
});
