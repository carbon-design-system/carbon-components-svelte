<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let onChange: (detail: { selected: boolean }) => void = () => {};
</script>

<SelectableTag on:change={({ detail }) => onChange(detail)}
  >Default</SelectableTag
>

<SelectableTag selected>Preselected</SelectableTag>

<SelectableTag icon={Add}>With icon</SelectableTag>

<SelectableTag disabled on:change={({ detail }) => onChange(detail)}>
  Disabled</SelectableTag
>
