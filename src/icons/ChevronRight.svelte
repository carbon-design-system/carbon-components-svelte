<script>
  export let size = 16;

  export let title = undefined;

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title;
  $: attributes = {
    "aria-hidden": labelled ? undefined : true,
    role: labelled ? "img" : undefined,
    focusable: Number($$props["tabindex"]) === 0 ? true : undefined,
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="currentColor"
  preserveAspectRatio="xMidYMid meet"
  width="{size}"
  height="{size}"
  {...attributes}
  {...$$restProps}
>
  {#if title}<title>{title}</title>{/if}
  <path d="M22 16L12 26 10.6 24.6 19.2 16 10.6 7.4 12 6z"></path>
</svg>
