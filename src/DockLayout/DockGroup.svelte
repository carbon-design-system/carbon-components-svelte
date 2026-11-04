<script>
  /**
   * A group: one strip of tabs over the panels of its documents.
   * @slot {{ document: import("./types.js").DockDocument; groupId: string }} panel
   * @slot {{}} empty
   */

  /**
   * The group this renders.
   * @type {import("../utils/dock-layout.js").DockGroup}
   */
  export let group;

  import { getContext, tick } from "svelte";
  import Tab from "../Tabs/Tab.svelte";
  import TabContent from "../Tabs/TabContent.svelte";
  import Tabs from "../Tabs/Tabs.svelte";

  /** @type {import("./types.js").DockContext} */
  const dock = getContext("carbon:DockLayout");
  const { shared } = dock;

  $: documents = group.tabs.flatMap((id) => {
    const document = $shared.documentsById[id];
    return document ? [document] : [];
  });
  $: number = $shared.groupNumbers.get(group.id) ?? 1;
  $: active = $shared.activeGroupId === group.id;
  $: maximized = $shared.maximized === group.id;
  $: covered = $shared.maximized !== null && !maximized;
  $: activeLabel = (
    documents.find((document) => document.id === group.activeId) ?? documents[0]
  )?.label;
  $: label = $shared.groupLabelText({
    index: number,
    count: $shared.groupNumbers.size,
    label: activeLabel,
  });

  // `Tabs` can't select a tab that registers in the same update as the
  // selection (it falls back to the current one), as a docked tab does. So the
  // selection follows the layout one tick later, once the tab is registered.
  let selectedId = group.activeId;
  $: follow(group.activeId);

  /** @param {string | undefined} id */
  async function follow(id) {
    if (id === selectedId) return;
    await tick();
    selectedId = group.activeId;
  }

  /** @param {CustomEvent<number>} event */
  function handleChange(event) {
    const document = documents[event.detail];
    if (document && document.id !== group.activeId) {
      dock.activate(document.id);
    }
  }

  /** @param {CustomEvent<{ id: string; newIndex: number; source: "pointer" | "keyboard" }>} event */
  function handleReorder(event) {
    const { id, newIndex, source } = event.detail;
    // A tab let go over anything but its own strip is the dock's to place.
    if (dock.docking.docking || !dock.reorder(group.id, id, newIndex, source)) {
      event.preventDefault();
    }
  }

  /** @param {CustomEvent<{ id: string }>} event */
  function handleDismiss(event) {
    if (!dock.close(event.detail.id)) event.preventDefault();
  }
</script>

<!-- A region is a landmark; a press inside it makes it the active group. -->
<!-- An empty group takes focus itself, so the keyboard can reach it. -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  role="region"
  aria-label={label}
  tabindex={documents.length === 0 ? -1 : undefined}
  data-dock-group={group.id}
  class:bx--dock__group={true}
  class:bx--dock__group--active={active}
  class:bx--dock__group--maximized={maximized}
  class:bx--dock__group--empty={documents.length === 0}
  inert={covered || undefined}
  on:focusin={() => dock.setActiveGroup(group.id)}
  on:pointerdown={() => dock.setActiveGroup(group.id)}
>
  {#if documents.length === 0}
    <div class:bx--dock__empty={true}>
      <slot name="empty">{$shared.emptyText}</slot>
    </div>
  {:else}
    <Tabs
      {selectedId}
      aria-label={$shared.stripLabelText({
        index: number,
        count: $shared.groupNumbers.size,
      })}
      type={$shared.type}
      size={$shared.size}
      dismissible={$shared.dismissible}
      reorderable
      overflowMenu
      on:change={handleChange}
      on:reorder={handleReorder}
      on:dismiss={handleDismiss}
    >
      {#each documents as document (document.id)}
        <Tab
          id={document.id}
          label={document.label}
          modified={document.modified}
          disabled={document.disabled}
        />
      {/each}
      <svelte:fragment slot="content">
        {#each documents as document (document.id)}
          <TabContent lazy={$shared.lazy}>
            <slot name="panel" {document} groupId={group.id} />
          </TabContent>
        {/each}
      </svelte:fragment>
    </Tabs>
  {/if}
</div>
