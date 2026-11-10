<script>
  import { caretRect, TextArea } from "carbon-components-svelte";

  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let value = "Type @ to put a marker at the caret.";
  /** @type {null | { left: number, top: number, height: number }} */
  let marker = null;

  /** Put the marker at the `@` just before the caret, or take it away. */
  function place() {
    if (!ref || ref.selectionStart !== ref.selectionEnd) {
      marker = null;
      return;
    }
    const at = ref.selectionStart - 1;
    if (at < 0 || ref.value[at] !== "@") {
      marker = null;
      return;
    }
    // Viewport coordinates, as the field is scrolled now.
    const rect = caretRect(ref, at);
    marker = rect
      ? { left: rect.left, top: rect.top, height: rect.height }
      : null;
  }
</script>

<svelte:window on:scroll|capture={place} on:resize={place} />

<TextArea
  labelText="Comment"
  rows={4}
  bind:ref
  bind:value
  on:input={place}
  on:keyup={place}
  on:click={place}
  on:blur={() => (marker = null)}
/>

{#if marker}
  <span
    class="caret-marker"
    aria-hidden="true"
    style:left="{marker.left}px"
    style:top="{marker.top + marker.height}px"
  >
    mention
  </span>
{/if}

<style>
  /* Fixed to the viewport, where the measurement is. */
  .caret-marker {
    position: fixed;
    z-index: 1;
    padding: 0 0.5rem;
    background-color: var(--cds-layer);
    border: 1px solid var(--cds-border-strong);
    color: var(--cds-text-primary);
    font-size: 0.75rem;
    pointer-events: none;
  }
</style>
