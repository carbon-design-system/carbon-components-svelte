import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TreeViewGetNode from "./TreeView.getNode.test.svelte";

describe("TreeView.getNode / getNodes", () => {
  const getButton = (testId: string) => screen.getByTestId(testId);

  beforeEach(() => {
    render(TreeViewGetNode);
  });

  it("returns the matching node for a nested id", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await user.click(getButton("get-node"));

    expect(consoleLog).toHaveBeenCalledWith(
      "getNode",
      expect.objectContaining({ id: 3, text: "Level 3 - Target" }),
    );
  });

  it("returns null for an id with no matching node", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await user.click(getButton("get-missing-node"));

    expect(consoleLog).toHaveBeenCalledWith("getNode", null);
  });

  it("resolves multiple ids and omits ids with no matching node", async () => {
    const consoleLog = vi.spyOn(console, "log");
    await user.click(getButton("get-nodes"));

    expect(consoleLog).toHaveBeenCalledWith(
      "getNodes",
      expect.arrayContaining([
        expect.objectContaining({ id: 3 }),
        expect.objectContaining({ id: 0 }),
      ]),
    );
    const nodes = consoleLog.mock.calls.find(
      (call) => call[0] === "getNodes",
    )?.[1];
    expect(nodes).toHaveLength(2);
  });
});
