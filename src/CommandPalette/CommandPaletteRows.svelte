<script context="module">
  /** @param {string} raw */
  function escapeHtml(raw) {
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * One HTML string for a label with its matched runs wrapped. Rendering the
   * runs as separate template nodes lets Svelte 3 pad them with whitespace,
   * as `SearchMenuItem` found.
   * @param {Array<{ text: string; match: boolean }>} segments
   * @returns {string}
   */
  function segmentsToHtml(segments) {
    return segments
      .map((segment) =>
        segment.match
          ? `<span class="bx--command-palette__match">${escapeHtml(segment.text)}</span>`
          : escapeHtml(segment.text),
      )
      .join("");
  }
</script>

<script>
  /**
   * Internal. The rows `CommandPalette` renders, in or out of a virtual
   * window: group headers and command options.
   * @slot {{ row: any; index: number; highlighted: boolean; segments: Array<{ text: string; match: boolean }>; }}
   * @slot {{ group: string; items: ReadonlyArray<any>; }} group
   */

  /**
   * Runs of rows from `splitGroupRuns`.
   * @type {ReadonlyArray<import("../ListBox/menu-groups.js").GroupRun>}
   */
  export let runs = [];

  /**
   * @type {null | import("../ListBox/menu-groups.js").GroupRows<any>}
   */
  export let groupRows = null;

  /** The palette's id; option ids are `{id}-{item.id}`. */
  export let id = "";

  /** @type {string | undefined} */
  export let highlightedId = undefined;

  /**
   * Character indices to highlight, by item id.
   * @type {Map<any, { text: number[]; description: number[] }>}
   */
  export let matches = new Map();

  export let highlightMatches = true;

  /** The number of results, for `aria-setsize`. */
  export let count = 0;

  export let measured = false;

  /** Whether to format shortcuts for an Apple platform. */
  export let apple = false;

  /** Whether the palette has a default slot for the row content. */
  export let customRow = false;

  /** @type {(item: any, event: Event) => void} */
  export let onSelect = noop;

  /** @type {(index: number) => void} */
  export let onHighlight = noop;

  import ListBoxMenuGroup from "../ListBox/ListBoxMenuGroup.svelte";
  import { highlightSegments } from "../utils/fuzzy-match.js";
  import {
    ariaKeyShortcuts,
    formatShortcut,
  } from "../utils/keyboard-shortcut.js";
  import { noop } from "../utils/noop.js";

  const NO_INDICES = [];
</script>

{#each runs as run (run.key)}
  <ListBoxMenuGroup
    labelledBy={run.groupIndex > -1
      ? `${id}-group-${run.groupIndex}`
      : undefined}
  >
    {#each run.rows as row, runIndex (row.id)}
      {@const rowIndex = run.start + runIndex}
      {@const index = groupRows ? groupRows.itemIndexByRow[rowIndex] : rowIndex}
      {#if index === -1}
        <!-- Hidden from assistive tech: a hidden label names the group, and
             stays rendered when a virtual window leaves this header out. -->
        <div
          role="presentation"
          aria-hidden="true"
          data-virtual-index={measured ? rowIndex : undefined}
          class:bx--command-palette__group-header={true}
          on:mousedown|preventDefault
        >
          <slot name="group" group={row.group} items={row.items} />
        </div>
      {:else}
        {@const optionId = `${id}-${row.id}`}
        {@const found = highlightMatches ? matches.get(row.id) : undefined}
        {@const segments = highlightSegments(
          row.text,
          found?.text ?? NO_INDICES,
        )}
        {@const highlighted = optionId === highlightedId}
        <svelte:element
          this={row.href ? "a" : "div"}
          id={optionId}
          href={row.href || undefined}
          role="option"
          tabindex="-1"
          aria-selected={highlighted}
          aria-disabled={row.disabled || undefined}
          aria-setsize={count}
          aria-posinset={index + 1}
          aria-keyshortcuts={row.shortcut
            ? ariaKeyShortcuts(row.shortcut, { apple })
            : undefined}
          data-virtual-index={measured ? rowIndex : undefined}
          class:bx--command-palette__item={true}
          class:bx--command-palette__item--highlighted={highlighted}
          class:bx--command-palette__item--disabled={row.disabled}
          on:click={(event) => onSelect(row, event)}
          on:mousedown|preventDefault
          on:mousemove={() => {
            if (!row.disabled && !highlighted) onHighlight(index);
          }}
        >
          {#if row.icon}
            <span class:bx--command-palette__item-icon={true}>
              <svelte:component this={row.icon} />
            </span>
          {/if}
          <span class:bx--command-palette__item-content={true}>
            {#if customRow}
              <slot {row} {index} {highlighted} {segments} />
            {:else}
              <span class:bx--command-palette__item-text={true}
                >{@html segmentsToHtml(segments)}</span
              >
              {#if row.description}
                <span class:bx--command-palette__item-description={true}
                  >{@html segmentsToHtml(
                    highlightSegments(
                      row.description,
                      found?.description ?? NO_INDICES,
                    ),
                  )}</span
                >
              {/if}
            {/if}
          </span>
          {#if row.shortcut}
            <span aria-hidden="true" class:bx--command-palette__shortcut={true}>
              {#each formatShortcut(row.shortcut, {
                apple,
              }) as key, keyIndex (keyIndex)}
                <kbd class:bx--command-palette__key={true}>{key}</kbd>
              {/each}
            </span>
          {/if}
        </svelte:element>
      {/if}
    {/each}
  </ListBoxMenuGroup>
{/each}
