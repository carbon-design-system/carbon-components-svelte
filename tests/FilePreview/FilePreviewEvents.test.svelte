<script lang="ts">
  import FilePreview from "carbon-components-svelte/FilePreview/FilePreview.svelte";

  export let onLoad: (event: CustomEvent) => void = () => {};
  export let onError: (event: CustomEvent) => void = () => {};
</script>

<FilePreview {...$$restProps} on:load={onLoad} on:load:error={onError} />
