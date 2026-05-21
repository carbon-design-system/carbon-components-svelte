<script>
  /**
   * @template {RecursiveListNode} [Node=RecursiveListNode]
   * @typedef {object} RecursiveListNode
   * @property {string | number} [id] - Unique node identifier; used as the each-block key when provided
   * @property {string} [text] - Node text content
   * @property {string} [href] - Node link URL
   * @property {string} [html] - Node HTML content
   * @property {import("svelte/elements").SvelteHTMLElements["a"]["target"]} [target] - Node link target
   * @property {import("svelte/elements").SvelteHTMLElements["a"]["rel"]} [rel] - Node link rel
   * @property {Array<string | RecursiveListNode>} [nodes] - Child nodes
   * @restProps {ul | ol}
   */

  /**
   * Specify the nodes to render.
   * A string entry is shorthand for `{ text: "..." }`.
   * @type {ReadonlyArray<string | (Node & { nodes?: Array<string | Node> })>}
   */
  export let nodes = [];

  /**
   * Specify the type of list to render.
   * @type {"unordered" | "ordered" | "ordered-native"}
   */
  export let type = "unordered";

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  import OrderedList from "../OrderedList/OrderedList.svelte";
  import UnorderedList from "../UnorderedList/UnorderedList.svelte";
  import RecursiveListItem from "./RecursiveListItem.svelte";
</script>

<svelte:component
  this={type === "unordered" ? UnorderedList : OrderedList}
  native={type === "ordered-native"}
  {expressive}
  {...$$restProps}
>
  {#each nodes as child, index (typeof child === "string" ? child : child.id ?? index)}
    {@const node = typeof child === "string" ? { text: child } : child}
    {#if Array.isArray(node.nodes)}
      <RecursiveListItem {...node}>
        <svelte:self {...node} {type} {expressive} nested />
      </RecursiveListItem>
    {:else}
      <RecursiveListItem {...node} />
    {/if}
  {/each}
</svelte:component>
