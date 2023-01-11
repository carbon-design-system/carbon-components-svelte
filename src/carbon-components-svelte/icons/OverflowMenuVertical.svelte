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
  <circle cx="16" cy="8" r="2"></circle><circle cx="16" cy="16" r="2"
  ></circle><circle cx="16" cy="24" r="2"></circle>
</svg>
