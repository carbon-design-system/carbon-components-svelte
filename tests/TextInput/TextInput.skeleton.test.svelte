<script lang="ts">
  import TextInputSkeleton from "carbon-components-svelte/TextInput/TextInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<TextInputSkeleton data-testid="text-input-skeleton" {hideLabel} />
