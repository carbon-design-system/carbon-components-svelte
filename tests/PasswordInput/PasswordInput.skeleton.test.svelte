<script lang="ts">
  import PasswordInputSkeleton from "carbon-components-svelte/TextInput/PasswordInputSkeleton.svelte";

  export let hideLabel = false;
</script>

<PasswordInputSkeleton data-testid="password-input-skeleton" {hideLabel} />
