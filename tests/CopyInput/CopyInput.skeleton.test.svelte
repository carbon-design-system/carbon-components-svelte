<script lang="ts">
  import CopyInputSkeleton from "carbon-components-svelte/CopyInput/CopyInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<CopyInputSkeleton data-testid="copy-input-skeleton" {hideLabel} />
