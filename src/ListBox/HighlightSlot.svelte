<script>
  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import { HIGHLIGHT_CURSOR_KEY } from "./highlightCursor.js";

  /** DOM id of the option this slot belongs to (`{instanceId}-{item.id}`) */
  export let optionId;

  const cursor = getContext(HIGHLIGHT_CURSOR_KEY);
  const highlightedIdStore = cursor?.highlightedId ?? readable(null);

  $: highlighted = $highlightedIdStore === optionId;
</script>

<slot {highlighted} />
