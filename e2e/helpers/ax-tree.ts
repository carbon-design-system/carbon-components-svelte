import type { CDPSession, Page } from "@playwright/test";

export type AXControl = {
  role: string;
  name: string;
  description: string;
  invalid: boolean;
  errorMessage: string;
};

type AXNode = {
  ignored: boolean;
  role?: { value: string };
  name?: { value: string };
  description?: { value: string };
  properties?: {
    name: string;
    value: {
      value?: unknown;
      relatedNodes?: { backendDOMNodeId: number }[];
    };
  }[];
  backendDOMNodeId?: number;
};

async function textOf(cdp: CDPSession, backendNodeId: number) {
  const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
  const { result } = await cdp.send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: "function () { return this.textContent.trim(); }",
    returnByValue: true,
  });
  return result.value as string;
}

async function describe(cdp: CDPSession, node: AXNode): Promise<AXControl> {
  const prop = (name: string) =>
    node.properties?.find((p) => p.name === name)?.value;
  const errorNodes = prop("errormessage")?.relatedNodes ?? [];
  const errorMessage = (
    await Promise.all(errorNodes.map((n) => textOf(cdp, n.backendDOMNodeId)))
  ).join(" ");

  return {
    role: node.role?.value ?? "",
    name: node.name?.value ?? "",
    description: node.description?.value ?? "",
    invalid: prop("invalid")?.value === "true",
    errorMessage,
  };
}

/**
 * Snapshot Chromium's own accessibility tree, the one NVDA and JAWS read
 * through Chrome and Edge. Playwright's `getByRole` and
 * `toHaveAccessibleDescription` run Playwright's own name computation,
 * which can differ from the browser's.
 */
export async function getAXTree(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send("Accessibility.getFullAXTree")) as {
    nodes: AXNode[];
  };

  return {
    /** Find unignored nodes by role and exact name. */
    query(role: string, name: string) {
      // `Accessibility.queryAXTree` can miss matches, so filter the full tree.
      const matches = nodes.filter(
        (node) =>
          !node.ignored &&
          node.role?.value === role &&
          node.name?.value === name &&
          node.backendDOMNodeId !== undefined,
      );
      return Promise.all(matches.map((node) => describe(cdp, node)));
    },
    dispose: () => cdp.detach(),
  };
}
