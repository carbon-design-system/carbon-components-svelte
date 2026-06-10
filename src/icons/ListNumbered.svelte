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
  <path d="M16 22H30V24H16z"></path>
  <path d="M16 8H30V10H16z"></path>
  <path
    d="M8 12 8 4 6 4 6 5 4 5 4 7 6 7 6 12 4 12 4 14 6 14 8 14 10 14 10 12 8 12z"
  ></path>
  <path
    d="M10,28H4V24a2,2,0,0,1,2-2H8V20H4V18H8a2,2,0,0,1,2,2v2a2,2,0,0,1-2,2H6v2h4Z"
  ></path>
</svg>
