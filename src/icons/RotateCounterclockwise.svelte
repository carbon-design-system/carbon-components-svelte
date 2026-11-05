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
    d="M2,28V16a2.0023,2.0023,0,0,1,2-2H16a2.0023,2.0023,0,0,1,2,2V28a2.0023,2.0023,0,0,1-2,2H4A2.0023,2.0023,0,0,1,2,28ZM4,16,3.9988,28H16V16Z"
  ></path>
  <path
    d="M17,2l1.41,1.41L15.83,6H21a7.0078,7.0078,0,0,1,7,7v5H26V13a5.0057,5.0057,0,0,0-5-5H15.83l2.58,2.59L17,12,12,7Z"
  ></path>
</svg>
