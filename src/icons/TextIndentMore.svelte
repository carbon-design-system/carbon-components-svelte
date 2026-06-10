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
  <path d="M20 6H30V8H20z"></path>
  <path d="M20 12H27V14H20z"></path>
  <path d="M20 18H30V20H20z"></path>
  <path d="M20 24H27V26H20z"></path>
  <path d="M14 4H16V28H14z"></path>
  <path
    d="M3.85 22.5 2.44 21.12 8.73 15 2.44 8.88 3.85 7.5 11.56 15 3.85 22.5z"
  ></path>
</svg>
