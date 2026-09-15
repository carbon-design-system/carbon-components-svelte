<!-- Named "Column" in carbon-icons-svelte; renamed here to avoid a sveld glob name clash with src/Grid/Column.svelte -->
<script>
  export let size = 16;

  export let title = undefined;

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title;
  $: attributes = {
    "aria-hidden": labelled ? undefined : true,
    role: labelled ? "img" : undefined,
    focusable: Number($$props.tabindex) === 0 ? true : undefined,
  };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="currentColor"
  preserveAspectRatio="xMidYMid meet"
  width={size}
  height={size}
  {...attributes}
  {...$$restProps}
>
  {#if title}
    <title>{title}</title>
  {/if}
  <path d="M24 4H26V28H24z"></path>
  <path
    d="M18,6V26H14V6h4m0-2H14a2,2,0,0,0-2,2V26a2,2,0,0,0,2,2h4a2,2,0,0,0,2-2V6a2,2,0,0,0-2-2Z"
  ></path>
  <path d="M6 4H8V28H6z"></path>
</svg>
