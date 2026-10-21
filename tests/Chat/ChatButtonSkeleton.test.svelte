<script lang="ts">
  import ChatButtonSkeleton from "carbon-components-svelte/Chat/ChatButtonSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let buttonProps: ComponentProps<ChatButtonSkeleton> = {};
</script>

<ChatButtonSkeleton data-testid="skeleton" {...buttonProps} />
