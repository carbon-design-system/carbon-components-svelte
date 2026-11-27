<script>
  /**
   * @restProps {svg | span}
   */

  /**
   * Specify the flag to draw: a named export of
   * `carbon-components-svelte/flags`, such as `JP`. Import only the flags
   * you use, so a bundler leaves the rest out. Without a flag, the component
   * draws the region code in a box of the same size.
   * @type {{ readonly code: string; readonly body: string } | undefined}
   */
  export let flag = undefined;

  /**
   * Specify the ISO 3166-1 code to show in the box when there is no `flag`.
   * Defaults to the code of `flag`. At 16 and 20 the box is too small for
   * 12px text, so it shows no text and the code is its `title`.
   */
  export let code = "";

  /**
   * Specify the width in pixels. The height is three quarters of it.
   * @type {16 | 20 | 24 | 32}
   */
  export let size = 20;

  /**
   * Specify a name to expose the flag as an image. Without one, the flag is
   * decoration, since the name of its region sits beside it, and is hidden
   * from assistive technology.
   * @type {string | undefined}
   */
  export let title = undefined;

  $: labelled = $$props["aria-label"] || $$props["aria-labelledby"] || title;
  $: label = code || flag?.code || "";
  // 12px text, the smallest Carbon sets, fits a box 24px wide or wider.
  $: textless = size < 24;
  /** @type {{ "aria-hidden": "true" | undefined; role: "img" | undefined }} */
  $: attributes = {
    "aria-hidden": labelled ? undefined : "true",
    role: labelled ? "img" : undefined,
  };
</script>

{#if flag}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 24"
    width={size}
    height={(size * 3) / 4}
    class:bx--flag={true}
    class:bx--flag--16={size === 16}
    class:bx--flag--20={size === 20}
    class:bx--flag--24={size === 24}
    class:bx--flag--32={size === 32}
    {...attributes}
    {...$$restProps}
  >
    {#if title}<title>{title}</title>{/if}
    <!-- {@html} exemption: `flag.body` is SVG markup that
    `scripts/build-flags.ts` generates from the layer specs in
    `scripts/flags/spec.ts` and commits to `src/flags`. It is the package's
    own data, never a consumer string, so it is not sanitized. A `flag` that
    an app builds from user input is the app's to sanitize. -->
    {@html flag.body}
  </svg>
{:else}
  <span
    class:bx--flag={true}
    class:bx--flag--badge={true}
    class:bx--flag--16={size === 16}
    class:bx--flag--20={size === 20}
    class:bx--flag--24={size === 24}
    class:bx--flag--32={size === 32}
    title={textless ? label.toUpperCase() : undefined}
    {...attributes}
    {...$$restProps}
    aria-label={title ?? $$restProps["aria-label"]}
    >{textless ? "" : label}</span
  >
{/if}
