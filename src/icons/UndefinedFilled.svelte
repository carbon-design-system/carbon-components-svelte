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
    d="M29.391,14.527L17.473,2.609C17.067,2.203,16.533,2,16,2s-1.067,0.203-1.473,0.609L2.609,14.527C2.203,14.933,2,15.466,2,16 s0.203,1.067,0.609,1.473l11.917,11.917C14.933,29.797,15.467,30,16,30s1.067-0.203,1.473-0.609l11.917-11.917 C29.797,17.067,30,16.534,30,16S29.797,14.933,29.391,14.527z M21,18H11v-4h10V18z"
  ></path>
  <path fill="none" d="M11 14H21V18H11z" data-icon-path="inner-path"></path>
</svg>
