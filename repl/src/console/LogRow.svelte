<script>
  import OverflowMenu from "carbon-components-svelte/src/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/src/OverflowMenu/OverflowMenuItem.svelte";
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import ChevronLeft from "carbon-icons-svelte/lib/ChevronLeft.svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import ErrorFilled from "carbon-icons-svelte/lib/ErrorFilled.svelte";
  import InformationFilled from "carbon-icons-svelte/lib/InformationFilled.svelte";
  import WarningAltFilled from "carbon-icons-svelte/lib/WarningAltFilled.svelte";
  import { sanitizeStyle } from "../../sandbox/inspect/format.js";
  import { jumpTo, postToPreview, request } from "../state.js";
  import ConsoleTable from "./ConsoleTable.svelte";
  import { collapsedGroups, entryText, push, toggleGroup } from "./store.js";
  import ValuePreview from "./ValuePreview.svelte";
  import ValueTree from "./ValueTree.svelte";

  /** @type {any} */
  export let entry;

  $: objects = (entry.args ?? []).filter((a) => a?.t === "object");
  $: node = objects.find((a) => a.sub === "node");
  $: groupOpen = entry.kind === "group" && !$collapsedGroups.has(entry.groupId);
  $: indent = entry.groups?.length ?? 0;

  async function copy(text) {
    await navigator.clipboard.writeText(text);
  }

  async function copyJson() {
    const result = await request({ type: "json", id: objects[0].id });
    if (result.text) await copy(result.text);
    else if (result.gone)
      push({
        kind: "system",
        level: "warn",
        text: "That value is from an earlier run",
      });
  }

  async function storeGlobal() {
    await request({ type: "store-global", id: objects[0].id });
  }

  function location(frame) {
    return `${frame.file}:${frame.line}`;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="row row--{entry.level} row--{entry.kind}"
  style:padding-left="{0.5 + indent}rem"
  on:mouseenter={() =>
    node && postToPreview({ type: "highlight", id: node.id })}
  on:mouseleave={() => node && postToPreview({ type: "unhighlight" })}
>
  <span class="icon" aria-hidden="true">
    {#if entry.kind === "group"}
      <button
        type="button"
        class="group-toggle"
        aria-expanded={groupOpen}
        aria-label={groupOpen ? "Collapse group" : "Expand group"}
        on:click={() => toggleGroup(entry.groupId)}
      >
        <ChevronRight size={12} class={groupOpen ? "open" : ""} />
      </button>
    {:else if entry.level === "error"}
      <ErrorFilled size={12} />
    {:else if entry.level === "warn"}
      <WarningAltFilled size={12} />
    {:else if entry.level === "info"}
      <InformationFilled size={12} />
    {:else if entry.kind === "command"}
      <ChevronRight size={12} />
    {:else if entry.kind === "result"}
      <ChevronLeft size={12} />
    {/if}
  </span>

  <div class="content">
    {#if entry.kind === "system" || entry.kind === "separator"}
      <span class="system">{entry.text}</span>
    {:else if entry.kind === "command"}
      <code class="command">{entry.text}</code>
    {:else}
      {#if entry.label}
        <span class="label">{entry.label} =</span>
      {/if}
      {#if entry.uncaught}
        <span class="label">Uncaught</span>
      {/if}
      {#each entry.parts ?? [] as part}
        {#if "text" in part}
          <span style={part.style ? sanitizeStyle(part.style) : ""}
            >{part.text}</span
          >
        {:else}
          <span style={part.style ? sanitizeStyle(part.style) : ""}
            ><ValueTree value={part.value} /></span
          >
        {/if}
      {/each}
      {#each entry.args ?? [] as arg, i}
        {#if i > 0 || entry.parts}
          {" "}
        {/if}
        {#if arg?.t === "object" && entry.kind !== "table"}
          <ValueTree value={arg} expanded={entry.expand} />
        {:else if entry.kind !== "table"}
          <ValuePreview value={arg} nested={entry.kind === "result"} />
        {/if}
      {/each}
      {#if entry.kind === "table"}
        <ConsoleTable table={entry.table} />
      {/if}
      {#if entry.frames?.length}
        <ul class="frames">
          {#each entry.frames as frame}
            <li>
              at {frame.fn || "(anonymous)"} (<button
                type="button"
                class="link"
                on:click={() => jumpTo(frame)}
              >
                {location(frame)}
              </button
              >)
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>

  <span class="meta">
    {#if entry.repeat > 1}
      <Tag size="sm" type={entry.level === "error" ? "red" : "gray"}
        >{entry.repeat}</Tag
      >
    {/if}
    {#if entry.source}
      <button
        type="button"
        class="link"
        title="Go to {entry.source.file}:{entry.source.line}:{entry.source
          .column}"
        on:click={() => jumpTo(entry.source)}
      >
        {location(entry.source)}
      </button>
    {/if}
    {#if entry.kind !== "separator" && entry.kind !== "system"}
      <OverflowMenu size="sm" flipped iconDescription="Entry actions">
        <OverflowMenuItem
          text="Copy text"
          on:click={() => copy(entryText(entry))}
        />
        {#if objects.length}
          <OverflowMenuItem text="Copy as JSON" on:click={copyJson} />
          <OverflowMenuItem
            text="Store as global variable"
            on:click={storeGlobal}
          />
        {/if}
      </OverflowMenu>
    {/if}
  </span>
</div>

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    min-height: 1.75rem;
    padding: 0.25rem 0.25rem 0.25rem 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    font:
      0.75rem / 1.25rem "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  .icon {
    flex: none;
    width: 0.75rem;
    padding-top: 0.25rem;
    line-height: 0;
  }

  .content {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: none;
    margin-top: -0.25rem;
  }

  .meta :global(.bx--overflow-menu) {
    visibility: hidden;
  }

  .row:hover .meta :global(.bx--overflow-menu),
  .row:focus-within .meta :global(.bx--overflow-menu) {
    visibility: visible;
  }

  .row--error {
    color: var(--cds-text-error, #da1e28);
    background: var(--cds-notification-background-error, #fff1f1);
  }

  .row--error .icon {
    fill: var(--cds-support-01, #da1e28);
  }

  .row--warn {
    background: var(--cds-notification-background-warning, #fcf4d6);
  }

  .row--warn .icon {
    fill: var(--cds-support-03, #f1c21b);
  }

  .row--info .icon {
    fill: var(--cds-support-04, #0043ce);
  }

  .row--debug,
  .row--system,
  .row--result .icon,
  .row--command .icon {
    color: var(--cds-text-02, #525252);
    fill: var(--cds-text-02, #525252);
  }

  .row--separator {
    color: var(--cds-text-02, #525252);
    background: var(--cds-ui-01, #f4f4f4);
    font-weight: 600;
  }

  .command {
    color: var(--cds-link-01, #0f62fe);
  }

  .label {
    color: var(--cds-text-02, #525252);
    margin-right: 0.25rem;
  }

  .frames {
    margin: 0.125rem 0 0;
    padding-left: 1rem;
    list-style: none;
    color: var(--cds-text-02, #525252);
  }

  .link,
  .group-toggle {
    padding: 0;
    border: 0;
    font: inherit;
    background: none;
    cursor: pointer;
  }

  .link {
    color: var(--cds-link-01, #0f62fe);
    text-decoration: underline;
    white-space: nowrap;
  }

  .group-toggle :global(svg) {
    transition: transform 70ms;
  }

  .group-toggle :global(svg.open) {
    transform: rotate(90deg);
  }

  .link:focus-visible,
  .group-toggle:focus-visible {
    outline: 2px solid var(--cds-focus, #0f62fe);
  }
</style>
