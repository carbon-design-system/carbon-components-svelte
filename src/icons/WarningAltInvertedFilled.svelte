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
    fill="none"
    d="M16,20a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,20Zm-1.125-5h2.25V6h-2.25Z"
    data-icon-path="inner-path"
  ></path>
  <path
    d="M27.3494,4H4.6506l-.0019.0034L15.998,25.8286h.004L27.3513,4.0034ZM14.875,6h2.25v9h-2.25ZM16,20a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,16,20Z"
  ></path>
  <path
    d="M29.855,2.481a1.001,1.001,0,0,1,.0322.98l-13,25a1,1,0,0,1-1.7744,0l-13-25A1,1,0,0,1,3,2H29A1.0007,1.0007,0,0,1,29.855,2.481ZM4.6487,4.0033,15.998,25.8286h.004L27.3513,4.0033,27.3493,4H4.6507Z"
  ></path>
</svg>
