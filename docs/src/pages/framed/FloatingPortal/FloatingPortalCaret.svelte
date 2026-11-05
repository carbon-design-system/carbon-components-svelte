<script>
  import {
    caretAnchor,
    FloatingPortal,
    Stack,
    TextArea,
    Tile,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const WHITESPACE = /\s/;
  const people = ["Amina", "Bao", "Carlos", "Dara", "Elif", "Farid"];

  let ref = null;
  let anchor = null;
  let open = false;
  let triggerIndex = 0;
  let typed = "";

  // The anchor reads the caret's place in the field, so the box follows it
  // through wrapping and scrolling. It holds still at the "@" as you type.
  $: if (ref && !anchor) anchor = caretAnchor(ref, () => triggerIndex);
  $: matches = people.filter((name) =>
    name.toLowerCase().startsWith(typed.toLowerCase()),
  );

  function handleInput() {
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

<Stack gap={5}>
  <p>Type an @ and a name to open a list under the @.</p>

  <TextArea
    bind:ref
    labelText="Message"
    rows={4}
    on:input={handleInput}
    on:keyup={handleInput}
  />
</Stack>

<FloatingPortal
  {anchor}
  {open}
  direction="bottom"
  flipAlign
  intrinsicWidth
  intrinsicAlign="start"
>
  <Tile>
    <Stack gap={2}>
      {#each matches as name (name)}
        <span>{name}</span>
      {/each}
    </Stack>
  </Tile>
</FloatingPortal>
