<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";

  export let onChange: (detail: { selected: boolean }) => void = () => {};
</script>

<SelectableTag on:change={({ detail }) => onChange(detail)}
  >Default</SelectableTag
>

<SelectableTag selected>Preselected</SelectableTag>

<SelectableTag disabled on:change={({ detail }) => onChange(detail)}>
  Disabled</SelectableTag
>
