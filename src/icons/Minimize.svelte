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
    d="M4 18 4 20 10.586 20 2 28.582 3.414 30 12 21.414 12 28 14 28 14 18 4 18z"
  ></path>
  <path
    d="M30 3.416 28.592 2 20 10.586 20 4 18 4 18 14 28 14 28 12 21.414 12 30 3.416z"
  ></path>
</svg>
