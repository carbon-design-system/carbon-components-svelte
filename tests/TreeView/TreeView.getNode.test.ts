import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewGetNode from "./TreeView.getNode.test.svelte";

describe("TreeView.getNode / getNodes", () => {
  const getButton = (testId: string) => screen.getByTestId(testId);

  it("returns the matching node for a nested id", async () => {
    const onGetNode = vi.fn();
    render(TreeViewGetNode, { onGetNode });
    await user.click(getButton("get-node"));

    expect(onGetNode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, text: "Level 3 - Target" }),
    );
  });

  it("returns null for an id with no matching node", async () => {
    const onGetNode = vi.fn();
    render(TreeViewGetNode, { onGetNode });
    await user.click(getButton("get-missing-node"));

    expect(onGetNode).toHaveBeenCalledWith(null);
  });

  it("resolves multiple ids and omits ids with no matching node", async () => {
    const onGetNodes = vi.fn();
    render(TreeViewGetNode, { onGetNodes });
    await user.click(getButton("get-nodes"));

    expect(onGetNodes).toHaveBeenCalledWith([
      expect.objectContaining({ id: 3 }),
      expect.objectContaining({ id: 0 }),
    ]);
  });
});
