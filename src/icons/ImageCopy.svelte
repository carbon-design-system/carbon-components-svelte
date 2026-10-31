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
  <path d="M4,22H2V4A2.0023,2.0023,0,0,1,4,2H22V4H4Z"></path>
  <path
    d="M21,17a3,3,0,1,0-3-3A3.0033,3.0033,0,0,0,21,17Zm0-4a1,1,0,1,1-1,1A1.0009,1.0009,0,0,1,21,13Z"
  ></path>
  <path
    d="M28,7H9A2.0025,2.0025,0,0,0,7,9V28a2.0025,2.0025,0,0,0,2,2H28a2.0025,2.0025,0,0,0,2-2V9A2.0025,2.0025,0,0,0,28,7Zm0,21H9v-6l4-3.9971,5.5859,5.586a2,2,0,0,0,2.8282,0L23,22.0034,28,27Zm0-3.8281-3.5859-3.586a2,2,0,0,0-2.8282,0L20,22.1719l-5.5859-5.586a2,2,0,0,0-2.8282,0L9,19.1719V9H28Z"
  ></path>
</svg>
