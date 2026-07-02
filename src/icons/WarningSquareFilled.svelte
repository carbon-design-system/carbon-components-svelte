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
    d="M26.0022,4H5.998A1.998,1.998,0,0,0,4,5.998V26.002A1.998,1.998,0,0,0,5.998,28H26.0022A1.9979,1.9979,0,0,0,28,26.002V5.998A1.9979,1.9979,0,0,0,26.0022,4ZM14.8752,8h2.25V18h-2.25ZM16,24a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,24Z"
  ></path>
  <path
    fill="none"
    d="M14.8751,8h2.25V18h-2.25ZM16,24a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,24Z"
    data-icon-path="inner-path"
  ></path>
</svg>
