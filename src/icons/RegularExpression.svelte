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
  <!-- A dot on the baseline and a raised six-armed asterisk, filling the
       artboard as the arrows do, with Carbon's 2-unit stroke. -->
  <rect x="4" y="22" width="4" height="4"></rect>
  <rect x="19" y="4" width="2" height="16"></rect>
  <rect x="19" y="4" width="2" height="16" transform="rotate(60 20 12)"></rect>
  <rect x="19" y="4" width="2" height="16" transform="rotate(-60 20 12)"></rect>
</svg>
