<script>
  /**
   * One node of the layout tree: a group, or a split. A split of N children is
   * N - 1 nested two-pane splitters, each holding one child and the rest.
   * @slot {{ document: import("./types.js").DockDocument; groupId: string }} panel
   * @slot {{}} empty
   */

  /**
   * The node to render.
   * @type {import("../utils/dock-layout.js").DockNode}
   */
  export let node;

  /**
   * The child indexes that lead from the root to this node.
   * @type {ReadonlyArray<number>}
   */
  export let path = [];

  /**
   * The first child of a split this renders. The splitter around it holds the
   * children from here on.
   */
  export let from = 0;

  import { getContext } from "svelte";
  import Splitter from "../Splitter/Splitter.svelte";
  import { groups } from "../utils/dock-layout.js";
  import DockGroup from "./DockGroup.svelte";
  import Self from "./DockNode.svelte";

  /** The smallest share, in percent, either side of a separator keeps. */
  const MIN_SHARE = 6;

  /** @type {import("./types.js").DockContext} */
  const dock = getContext("carbon:DockLayout");
  const { shared } = dock;

  $: split = node.type === "group" ? null : node;
  $: last = split ? split.children.length - 1 : 0;
  $: tail = split
    ? split.sizes.slice(from).reduce((sum, size) => sum + size, 0)
    : 0;
  // The splitter holds one child against the rest, so its size is the
  // child's share of what is left of the split.
  $: startSize = split
    ? Math.round((split.sizes[from] / tail) * 10000) / 100
    : 0;
  $: childPath = [...path, from];

  /**
   * The names of the groups a subtree holds, as a range of their numbers.
   * @param {import("../utils/dock-layout.js").DockNode} child
   * @param {Map<string, number>} numbers
   */
  function nameOf(child, numbers) {
    const found = groups(child).map((group) => numbers.get(group.id) ?? 0);
    return $shared.groupName({
      first: Math.min(...found),
      last: Math.max(...found),
    });
  }

  $: separatorLabel =
    split && from < last
      ? $shared.resizeLabelText({
          before: nameOf(split.children[from], $shared.groupNumbers),
          after: nameOf(
            { ...split, children: split.children.slice(from + 1) },
            $shared.groupNumbers,
          ),
        })
      : undefined;

  /** @param {CustomEvent<{ size: number }>} event */
  function handleResize(event) {
    if (!split) return;
    const sizes = [...split.sizes];
    const rest = tail - sizes[from];
    const next = (tail * event.detail.size) / 100;
    // The children after the separator share what the first one left.
    for (let i = from + 1; i < sizes.length; i++) {
      sizes[i] = (sizes[i] / rest) * (tail - next);
    }
    sizes[from] = next;
    dock.resize(path, sizes);
  }
</script>

{#if node.type === "group"}
  {#key node.id}
    <DockGroup group={node}>
      <svelte:fragment slot="panel" let:document let:groupId>
        <slot name="panel" {document} {groupId} />
      </svelte:fragment>
      <svelte:fragment slot="empty"><slot name="empty" /></svelte:fragment>
    </DockGroup>
  {/key}
{:else if split && from >= last}
  <Self node={split.children[from]} path={childPath}>
    <svelte:fragment slot="panel" let:document let:groupId>
      <slot name="panel" {document} {groupId} />
    </svelte:fragment>
    <svelte:fragment slot="empty"><slot name="empty" /></svelte:fragment>
  </Self>
{:else if split}
  <Splitter
    size={startSize}
    orientation={split.type === "row" ? "horizontal" : "vertical"}
    min={MIN_SHARE}
    max={100 - MIN_SHARE}
    disabled={$shared.maximized !== null}
    {separatorLabel}
    on:resize={handleResize}
  >
    <svelte:fragment slot="start">
      <Self node={split.children[from]} path={childPath}>
        <svelte:fragment slot="panel" let:document let:groupId>
          <slot name="panel" {document} {groupId} />
        </svelte:fragment>
        <svelte:fragment slot="empty"><slot name="empty" /></svelte:fragment>
      </Self>
    </svelte:fragment>
    <svelte:fragment slot="end">
      <Self node={split} {path} from={from + 1}>
        <svelte:fragment slot="panel" let:document let:groupId>
          <slot name="panel" {document} {groupId} />
        </svelte:fragment>
        <svelte:fragment slot="empty"><slot name="empty" /></svelte:fragment>
      </Self>
    </svelte:fragment>
  </Splitter>
{/if}
