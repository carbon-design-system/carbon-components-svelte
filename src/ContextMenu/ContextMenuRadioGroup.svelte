<script>
  /**
   * Set the selected radio group id.
   * @bindable writable
   */
  export let selectedId = "";

  /** Specify the label text */
  export let labelText = "";

  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  /**
   * @type {import("svelte/store").Writable<string>}
   */
  const currentId = writable("");
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<string>>}
   */
  const radioIds = writable([]);

  /**
   * @type {(data: { id: string }) => void}
   */
  function addOption({ id }) {
    if (!$radioIds.includes(id)) {
      radioIds.update((_) => [..._, id]);
    }
  }

  /**
   * @type {(data: { id: string }) => void}
   */
  function setOption({ id }) {
    selectedId = id;
  }

  setContext("carbon:ContextMenuRadioGroup", {
    currentId,
    radioIds,
    addOption,
    setOption,
  });

  $: currentId.set(selectedId);
</script>

<li role="none">
  <ul role="group" aria-label={labelText}>
    <slot />
  </ul>
</li>
