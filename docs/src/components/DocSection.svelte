<script lang="ts">
  export let variant: "default" | "foundation" | "metrics" | "ecosystem" =
    "default";
</script>

<section
  class="section"
  class:section--foundation={variant === "foundation"}
  class:section--metrics={variant === "metrics"}
  class:section--ecosystem={variant === "ecosystem"}
>
  <slot />
</section>
