export type Node = { type: string; data?: unknown; children?: Node[] };
export type Parent = Node & { children: Node[] };

type Visitor<T> = (
  node: T,
  index: number | undefined,
  parent: Parent | undefined,
) => void;

/**
 * Reads children after the visitor returns, so it can rewrite them. A
 * visitor that swaps its node out must keep `parent.children` the same
 * length.
 */
export function visit(tree: Node, visitor: Visitor<Node>): void;
export function visit<T = Node>(
  tree: Node,
  type: string,
  visitor: Visitor<T>,
): void;
export function visit(
  tree: Node,
  typeOrVisitor: string | Visitor<Node>,
  visitor?: Visitor<Node>,
): void {
  const type = typeof typeOrVisitor === "string" ? typeOrVisitor : undefined;
  const callback = (visitor ?? typeOrVisitor) as Visitor<Node>;
  const walk = (
    node: Node,
    index: number | undefined,
    parent: Parent | undefined,
  ) => {
    if (type === undefined || node.type === type) callback(node, index, parent);
    const children = (node as Partial<Parent>).children;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
      walk(children[i], i, node as Parent);
    }
  };
  walk(tree, undefined, undefined);
}
