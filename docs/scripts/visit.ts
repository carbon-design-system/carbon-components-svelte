/** A unist node, such as an mdast or hast node. */
export type Node = { type: string; data?: unknown; children?: Node[] };
export type Parent = Node & { children: Node[] };

type Visitor<T> = (
  node: T,
  index: number | undefined,
  parent: Parent | undefined,
) => void;

/**
 * Calls `visitor` on `tree` and every node under it, depth-first in
 * document order, with the node's index in its parent. With a `type`, only
 * on nodes of that type, which the visitor's parameter type is trusted to
 * describe.
 *
 * A node's children are read after its visitor returns, so the visitor can
 * rewrite them. A visitor that swaps its node out of `parent` should keep
 * `parent.children` the same length, or siblings are skipped or revisited.
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
