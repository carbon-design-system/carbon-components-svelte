<script>
  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  /** DOM id of the option this slot belongs to (`{instanceId}-{item.id}`) */
  export let optionId;

  const cursor = getContext("carbon:ListBoxHighlight");
  const highlightedId = cursor?.highlightedId ?? readable(null);

  $: highlighted = $highlightedId === optionId;
</script>

<slot {highlighted} />
