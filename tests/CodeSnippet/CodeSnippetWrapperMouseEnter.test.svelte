<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  export let onMouseEnter = (_event: MouseEvent) => {};
</script>

<CodeSnippet
  type="single"
  code="npm install --save @carbon/icons"
  on:mouseenter={onMouseEnter}
/>
