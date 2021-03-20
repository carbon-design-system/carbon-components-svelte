<script>
  /** Set the selected radio group id */
  export let selectedId = "";

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const currentId = writable("");
  const radioIds = writable([]);

  setContext("ContextMenuRadioGroup", {
    currentId,
    radioIds,
    addOption: ({ id }) => {
      if (!$radioIds.includes(id)) {
        radioIds.update((_) => [..._, id]);
      }
    },
    setOption: ({ id }) => {
      selectedId = id;
    },
  });

  $: currentId.set(selectedId);
</script>

<li role="none">
  <ul role="group" aria-label="{labelText}">
    <slot />
  </ul>
</li>
