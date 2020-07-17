<script>
  export let href = "#main-content";
  export let tabindex = "0";
</script>

<a {...$$props} class:bx--skip-to-content={true} {href} {tabindex} on:click>
  <slot>Skip to main content</slot>
</a>
