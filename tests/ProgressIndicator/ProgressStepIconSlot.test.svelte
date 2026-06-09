<script lang="ts">
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
</script>

<ProgressIndicator currentIndex={1}>
  <ProgressStep complete label="Step 1" description="Completed">
    <span slot="icon" data-testid="icon-1" let:complete let:current let:invalid
      >c:{complete}|cur:{current}|inv:{invalid}</span
    >
  </ProgressStep>
  <ProgressStep label="Step 2" description="Current">
    <span slot="icon" data-testid="icon-2" let:complete let:current let:invalid
      >c:{complete}|cur:{current}|inv:{invalid}</span
    >
  </ProgressStep>
  <ProgressStep invalid label="Step 3" description="Invalid">
    <span slot="icon" data-testid="icon-3" let:complete let:current let:invalid
      >c:{complete}|cur:{current}|inv:{invalid}</span
    >
  </ProgressStep>
</ProgressIndicator>
