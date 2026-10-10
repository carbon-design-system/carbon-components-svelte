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
  <path d="M16 28H30V30H16z"></path>
  <path d="M16 23H30V25H16z"></path>
  <path
    d="M10.8458,30H13L8.64,20H6.36L2,30H4.1542l.8-2h5.0916ZM5.7541,26,7.5,21.6347,9.2459,26Z"
  ></path>
  <path d="M2 15H30V17H2z"></path>
  <path d="M16 7H30V9H16z"></path>
  <path d="M16 2H30V4H16z"></path>
  <path
    d="M10.8458,12H13L8.64,2H6.36L2,12H4.1542l.8-2h5.0916ZM5.7541,8,7.5,3.6347,9.2459,8Z"
  ></path>
</svg>
