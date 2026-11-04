<script>
  // A text widget that counts how often its props are set, by field id, so a
  // test can tell which fields a keystroke re-rendered.
  import TextWidget from "carbon-components-svelte/SchemaForm/widgets/TextWidget.svelte";

  export let id = undefined;

  $: bump($$props);

  function bump(props) {
    window.__sfUpdates ??= {};
    const key = props.id ?? id;
    window.__sfUpdates[key] = (window.__sfUpdates[key] ?? 0) + 1;
  }
</script>

<TextWidget {...$$props} on:change />
