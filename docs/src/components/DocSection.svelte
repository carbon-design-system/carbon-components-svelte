<script lang="ts">
  export let variant:
    | "default"
    | "foundation"
    | "metrics"
    | "optimize"
    | "ecosystem" = "default";
</script>

<section
  class="section"
  class:section--foundation={variant === "foundation"}
  class:section--metrics={variant === "metrics"}
  class:section--optimize={variant === "optimize"}
  class:section--ecosystem={variant === "ecosystem"}
>
  <slot />
</section>
