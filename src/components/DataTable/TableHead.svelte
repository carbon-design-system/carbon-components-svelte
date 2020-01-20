<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;
</script>

<thead on:click on:mouseover on:mouseenter on:mouseleave class={className} {style}>
  <slot />
</thead>
