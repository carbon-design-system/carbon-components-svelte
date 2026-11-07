<script lang="ts">
  import type { FocusHandoffOptions } from "../../src/utils/focus-handoff.js";
  import {
    captureFocusTarget,
    focusHandoff,
  } from "../../src/utils/focus-handoff.js";

  /** "action": the `focusHandoff` action. "explicit": `captureFocusTarget`. */
  export let mode: "action" | "explicit" = "action";
  export let rows: string[] = ["a", "b", "c", "d"];
  export let onAnnounce: (reason: string) => void = () => {};

  let list: HTMLUListElement;
  let swap: HTMLDivElement;
  let running = true;

  // Only the "action" mode watches the list; "explicit" runs on its own.
  function watch(node: HTMLElement, options: FocusHandoffOptions) {
    return mode === "action" ? focusHandoff(node, options) : {};
  }

  function remove(event: MouseEvent, id: string) {
    if (mode === "action") {
      rows = rows.filter((r) => r !== id);
      return;
    }
    const restore = captureFocusTarget(
      (event.currentTarget as HTMLElement).closest("li"),
      {
        siblings: "li",
        fallback: () => list,
        announce: (info) => onAnnounce(info.reason),
      },
    );
    rows = rows.filter((r) => r !== id);
    restore();
  }

  function moveUp(id: string) {
    const i = rows.indexOf(id);
    if (i < 1) return;
    const next = rows.slice();
    next.splice(i - 1, 2, rows[i], rows[i - 1]);
    rows = next;
  }

  function toggle() {
    const restore = captureFocusTarget(swap, {
      find: () => swap.querySelector("button"),
    });
    running = !running;
    restore();
  }
</script>

<ul
  bind:this={list}
  tabindex="-1"
  data-testid="list"
  use:watch={{ items: "li", announce: (info) => onAnnounce(info.reason) }}
>
  {#each rows as id (id)}
    <li data-id={id}>
      <button type="button" on:click={() => moveUp(id)}>Up {id}</button>
      <button type="button" on:click={(e) => remove(e, id)}>Delete {id}</button>
    </li>
  {/each}
</ul>

<div bind:this={swap}>
  {#if running}
    <button type="button" on:click={toggle}>Cancel</button>
  {:else}
    <button type="button" on:click={toggle}>Retry</button>
  {/if}
</div>

<button type="button" on:click={() => (rows = rows.filter((r) => r !== "b"))}>
  App removes b
</button>
