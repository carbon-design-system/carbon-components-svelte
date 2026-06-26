<script lang="ts">
  export let size = 16;
  export let title: string | undefined = undefined;
</script>

<svg data-testid="custom-icon" width={size} height={size}>
  {#if title}
    <title>{title}</title>
  {/if}
</svg>
