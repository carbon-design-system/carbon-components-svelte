<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;
</script>

<tbody aria-live={$$props['aria-live'] || 'polite'} class={className} {style}>
  <slot />
</tbody>
