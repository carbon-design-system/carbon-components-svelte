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
    d="M25.1,10.66,23.58,12a6,6,0,0,1-.18,7.94l1.47,1.36a8,8,0,0,0,.23-10.59Z"
  ></path>
  <path
    d="M20,30a1,1,0,0,1-.71-.3L11.67,22H5a1,1,0,0,1-1-1H4V11a1,1,0,0,1,1-1h6.67l7.62-7.7a1,1,0,0,1,1.41,0A1,1,0,0,1,21,3V29A1,1,0,0,1,20,30ZM6,20h6a1.17,1.17,0,0,1,.79.3L19,26.57V5.43L12.79,11.7A1.17,1.17,0,0,1,12,12H6Z"
  ></path>
</svg>
