<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";

  type CategoryNode = {
    id: string;
    text: string;
    category: string;
    nodes: ProductNode[];
  };

  type ProductLeafNode = {
    id: string;
    text: string;
    price: number;
    category: string;
  };

  // Discriminated union type to represent either a category node or a product leaf node.
  type ProductNode = CategoryNode | ProductLeafNode;

  const nodes = [
    {
      id: "electronics",
      text: "Electronics",
      category: "Electronics",
      nodes: [
        { id: "laptop", text: "Laptop", price: 999, category: "Electronics" },
        { id: "phone", text: "Phone", price: 599, category: "Electronics" },
      ],
    },
    {
      id: "furniture",
      text: "Furniture",
      category: "Furniture",
      nodes: [
        { id: "desk", text: "Desk", price: 299, category: "Furniture" },
        { id: "chair", text: "Chair", price: 199, category: "Furniture" },
      ],
    },
  ] as const satisfies ProductNode[];

  type SelectDetail = ProductNode & {
    expanded: boolean;
    leaf: boolean;
    selected: boolean;
  };

  // Use a type guard to check if the node is a product leaf.
  function isProductLeaf(node: ProductNode): node is ProductLeafNode {
    return "price" in node;
  }

  export let onselect: ((detail: SelectDetail) => void) | undefined = undefined;
</script>

<TreeView
  {nodes}
  labelText="Products"
  on:select={(e) => {
    const node = e.detail;
    onselect?.(node);
    if (isProductLeaf(node)) {
      void node.price;
    }
    void node.category;
  }}
  let:node
>
  <div>
    {node.id}
    <strong>{node.text}</strong>
    {#if isProductLeaf(node)}
      - ${node.price}
    {/if}
    <span>({node.category})</span>
  </div>
</TreeView>
