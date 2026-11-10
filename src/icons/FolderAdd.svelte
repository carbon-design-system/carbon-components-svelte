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
    d="M26 20 24 20 24 24 20 24 20 26 24 26 24 30 26 30 26 26 30 26 30 24 26 24z"
  ></path><path
    d="M28,8H16l-3.4-3.4C12.2,4.2,11.7,4,11.2,4H4C2.9,4,2,4.9,2,6v20c0,1.1,0.9,2,2,2h14v-2H4V6h7.2l3.4,3.4l0.6,0.6H28v8h2v-8	C30,8.9,29.1,8,28,8z"
  ></path>
</svg>
