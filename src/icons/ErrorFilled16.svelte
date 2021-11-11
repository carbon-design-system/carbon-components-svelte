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
  data-carbon-icon="ErrorFilled16"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keyup
  on:keydown
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 16 16"
  fill="currentColor"
  width="16"
  height="16"
  class="{className}"
  preserveAspectRatio="xMidYMid meet"
  style="{style}"
  id="{id}"
  {...attributes}
>
  <path
    d="M8,1C4.1,1,1,4.1,1,8s3.1,7,7,7s7-3.1,7-7S11.9,1,8,1z M10.7,11.5L4.5,5.3l0.8-0.8l6.2,6.2L10.7,11.5z"
  ></path><path
    fill="none"
    d="M10.7,11.5L4.5,5.3l0.8-0.8l6.2,6.2L10.7,11.5z"
    data-icon-path="inner-path"
    opacity="0"></path>
  <slot>
    {#if title}
      <title>{title}</title>
    {/if}
  </slot>
</svg>
