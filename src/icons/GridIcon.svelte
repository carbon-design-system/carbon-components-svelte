<!-- Named "Grid" in carbon-icons-svelte; renamed here to avoid a sveld glob name clash with src/Grid/Grid.svelte -->
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
  <path
    d="M12,4H6A2,2,0,0,0,4,6v6a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V6A2,2,0,0,0,12,4Zm0,8H6V6h6Z"
  ></path>
  <path
    d="M26,4H20a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4Zm0,8H20V6h6Z"
  ></path>
  <path
    d="M12,18H6a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V20A2,2,0,0,0,12,18Zm0,8H6V20h6Z"
  ></path>
  <path
    d="M26,18H20a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V20A2,2,0,0,0,26,18Zm0,8H20V20h6Z"
  ></path>
</svg>
