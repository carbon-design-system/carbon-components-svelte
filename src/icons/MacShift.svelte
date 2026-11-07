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
    d="M21,28H11a2.0023,2.0023,0,0,1-2-2V16H4a1,1,0,0,1-.707-1.707l12-12a.9994.9994,0,0,1,1.414,0l12,12A1,1,0,0,1,28,16H23V26A2.0027,2.0027,0,0,1,21,28ZM6.4141,14H11V26H21V14h4.5859L16,4.4141Z"
  ></path>
</svg>
