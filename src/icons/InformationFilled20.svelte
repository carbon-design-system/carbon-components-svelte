<script>
  let className = undefined;
  export { className as class };
  export let id = undefined;
  export let tabindex = undefined;
  export let focusable = false;
  export let title = undefined;
  export let style = undefined;

  $: ariaLabel = $$props["aria-label"];
  $: ariaLabelledBy = $$props["aria-labelledby"];
  $: labelled = ariaLabel || ariaLabelledBy || title;
  $: attributes = {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-hidden": labelled ? undefined : true,
    role: labelled ? "img" : undefined,
    focusable: tabindex === "0" ? true : focusable,
    tabindex,
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<svg
  data-carbon-icon="InformationFilled20"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keyup
  on:keydown
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="currentColor"
  width="20"
  height="20"
  class="{className}"
  preserveAspectRatio="xMidYMid meet"
  style="{style}"
  id="{id}"
  {...attributes}
>
  <path
    fill="none"
    d="M16,8a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,13.875H17.125v-8H13v2.25h1.875v5.75H12v2.25h8Z"
    data-icon-path="inner-path"></path><path
    d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,6a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,8Zm4,16.125H12v-2.25h2.875v-5.75H13v-2.25h4.125v8H20Z"
  ></path>
  <slot>
    {#if title}
      <title>{title}</title>
    {/if}
  </slot>
</svg>
