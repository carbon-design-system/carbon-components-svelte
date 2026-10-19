<script>
  /**
   * @template {RecursiveListNode} [Node=RecursiveListNode]
   * @typedef {object} RecursiveListNode
   * @property {string | number} [id] - Unique node identifier; used as the each-block key when provided
   * @property {string} [text] - Node text content
   * @property {string} [href] - Node link URL
   * @property {string} [html] - Node HTML content, rendered unsanitized with `@html`; pass only trusted or sanitized markup
   * @property {import("svelte/elements").SvelteHTMLElements["a"]["target"]} [target] - Node link target
   * @property {import("svelte/elements").SvelteHTMLElements["a"]["rel"]} [rel] - Node link rel
   * @property {RecursiveListNode[]} [nodes] - Child nodes
   * @restProps {ul | ol}
   */

  /**
   * Specify the nodes to render.
   * @type {ReadonlyArray<Node & { nodes?: Node[] }>}
   */
  export let nodes = [];

  /**
   * Specify the type of list to render.
   * @type {"unordered" | "ordered" | "ordered-native"}
   */
  export let type = "unordered";

  /** Set to `true` to use Carbon's expressive typesetting */
  export let expressive = false;

  /** Set to `true` to use the nested variant, as for a list inside a list item */
  export let nested = false;

  import OrderedList from "../OrderedList/OrderedList.svelte";
  import UnorderedList from "../UnorderedList/UnorderedList.svelte";
  import { resolveLinkRel } from "../utils/link-rel.js";
</script>

<svelte:component
  this={type === "unordered" ? UnorderedList : OrderedList}
  native={type === "ordered-native" || undefined}
  {expressive}
  {nested}
  {...$$restProps}
>
  {#each nodes as child, index (child.id ?? `index:${index}`)}
    <li class:bx--list__item={true}>
      {#if child.text && !child.href}
        {child.text}
      {/if}
      {#if child.href}
        <a
          class:bx--link={true}
          href={child.href}
          target={child.target}
          rel={resolveLinkRel(child.target, child.rel)}
        >
          {child.text || child.href}
        </a>
      {/if}
      {#if !child.text && child.html}
        {@html child.html}
      {/if}
      {#if child.nodes?.length}
        <svelte:self nodes={child.nodes} {type} {expressive} nested />
      {/if}
    </li>
  {/each}
</svelte:component>
