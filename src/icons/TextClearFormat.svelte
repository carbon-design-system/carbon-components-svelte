<script>
  export let size = 16;

  /**
   * Specify the icon title.
   * @type {string | undefined}
   */
  export let title = undefined;

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title;
  /**
   * Literal "true", not a boolean: Svelte 3 and 4 write a spread `true` as
   * a bare attribute on the server.
   * @type {{ "aria-hidden": "true" | undefined; role: "img" | undefined; focusable: "true" | undefined }}
   */
  let attributes;
  $: attributes = {
    "aria-hidden": labelled ? undefined : "true",
    role: labelled ? "img" : undefined,
    focusable: Number($$props.tabindex) === 0 ? "true" : undefined,
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
    d="M29.4384,16.5715l-7.985-7.9856a2.0014,2.0014,0,0,0-2.8291,0l-5.3584,5.3584L9,2H7L2,16H4l.999-3h6l.8035,2.4077L4.5858,22.6244a2,2,0,0,0,0,2.8282L9.1316,30h9.5908l10.716-10.717A1.9173,1.9173,0,0,0,29.4384,16.5715ZM5.6653,11l2.331-7,2.3355,7Zm12.229,17H9.96L6,24.0381l6.3123-6.3115L20.24,25.6538Zm3.76-3.76-7.9275-7.9272L20.0393,10l7.9268,7.9272Z"
  ></path>
</svg>
