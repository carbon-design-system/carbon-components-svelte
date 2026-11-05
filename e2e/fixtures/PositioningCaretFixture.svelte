<script>
  import ListBoxMenu from "carbon-components-svelte/ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "carbon-components-svelte/ListBox/ListBoxMenuItem.svelte";
  // A menu that follows the caret of a field, as a mentions list does: type
  // "@" and the menu opens under the "@", and stays there as the query grows.
  //   ?field=textarea|input  ?dir=rtl  ?at=top|bottom (where the field sits)
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";
  import { caretAnchor } from "carbon-components-svelte/utils/virtual-anchor.js";
  import { onMount } from "svelte";

  const query = new URLSearchParams(location.search);
  const field = query.get("field") ?? "textarea";
  const place = query.get("at") ?? "top";
  if (query.get("dir") === "rtl") document.documentElement.dir = "rtl";

  const WHITESPACE = /\s/;
  const people = ["Amina", "Bao", "Carlos", "Dara", "Elif", "Farid"];

  /** @type {HTMLTextAreaElement | HTMLInputElement | null} */
  let ref = null;
  let open = false;
  let triggerIndex = 0;
  let typed = "";
  /** @type {ReturnType<typeof caretAnchor> | null} */
  let anchor = null;

  $: if (ref && !anchor) anchor = caretAnchor(ref, () => triggerIndex);
  $: matches = people.filter((name) =>
    name.toLowerCase().startsWith(typed.toLowerCase()),
  );

  // The menu stays at the "@", not the caret, so it holds still as you type.
  function handleInput() {
    if (!ref) return;
    const caret = ref.selectionStart ?? 0;
    const at = ref.value.lastIndexOf("@", caret - 1);
    if (at !== -1 && !WHITESPACE.test(ref.value.slice(at + 1, caret))) {
      triggerIndex = at;
      typed = ref.value.slice(at + 1, caret);
      open = matches.length > 0;
    } else {
      open = false;
    }
  }

  onMount(() => () => anchor?.destroy());
</script>

<div
  style={place === "bottom"
    ? "position: fixed; bottom: 0.5rem; left: 2rem; width: 18rem"
    : "padding: 1rem 2rem; width: 18rem"}
>
  {#if field === "input"}
    <input
      bind:this={ref}
      data-testid="field"
      class="bx--text-input"
      aria-label="Message"
      on:input={handleInput}
      on:keyup={handleInput}
    />
  {:else}
    <textarea
      bind:this={ref}
      data-testid="field"
      class="bx--text-area"
      aria-label="Message"
      rows="4"
      on:input={handleInput}
      on:keyup={handleInput}></textarea>
  {/if}
</div>

<FloatingPortal
  {anchor}
  {open}
  direction="bottom"
  intrinsicWidth
  intrinsicAlign="start"
  flipAlign
>
  <div style="min-width: 12rem">
    <ListBoxMenu
      style="position: static; max-height: 13.75rem;"
      data-testid="menu"
    >
      {#each matches as name (name)}
        <ListBoxMenuItem>{name}</ListBoxMenuItem>
      {/each}
    </ListBoxMenu>
  </div>
</FloatingPortal>
