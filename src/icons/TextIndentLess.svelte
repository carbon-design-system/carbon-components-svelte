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
  <path d="M2 6H12V8H2z"></path>
  <path d="M5 12H12V14H5z"></path>
  <path d="M2 18H12V20H2z"></path>
  <path d="M5 24H12V26H5z"></path>
  <path d="M16 4H18V28H16z"></path>
  <path
    d="M28.15 23.5 29.56 22.12 23.27 16 29.56 9.88 28.15 8.5 20.44 16 28.15 23.5z"
  ></path>
</svg>
