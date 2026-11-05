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
    d="M28,30H16a2.0023,2.0023,0,0,1-2-2V16a2.0023,2.0023,0,0,1,2-2H28a2.0023,2.0023,0,0,1,2,2V28A2.0023,2.0023,0,0,1,28,30ZM16,16V28H28.0012L28,16Z"
  ></path>
  <path
    d="M15,2,13.59,3.41,16.17,6H11a7.0078,7.0078,0,0,0-7,7v5H6V13a5.0057,5.0057,0,0,1,5-5h5.17l-2.58,2.59L15,12l5-5Z"
  ></path>
</svg>
