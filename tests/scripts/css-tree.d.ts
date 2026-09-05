// css-tree ships no types and its @types package is not a dependency.
// scripts/lib/css-cascade.ts is only type-checked because this workspace
// imports it, so declare the small surface it uses.
declare module "css-tree" {
  export interface CssNode {
    type: string;
    // biome-ignore lint/suspicious/noExplicitAny: loosely typed AST
    [key: string]: any;
  }
  export interface Selector extends CssNode {
    type: "Selector";
  }
  // biome-ignore lint/suspicious/noExplicitAny: loosely typed AST
  type Visitor = (node: any, item?: any, list?: any) => void;
  export function parse(css: string, options?: object): CssNode;
  export function generate(node: CssNode): string;
  export function walk(
    node: CssNode,
    options: Visitor | { visit?: string; enter?: Visitor; leave?: Visitor },
  ): void;
}
