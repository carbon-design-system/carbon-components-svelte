<script>
  import Flag from "../Flag/Flag.svelte";

  /**
   * One option row of an `IntlPicker`: the name, then what the source knows
   * about the code. A row asks the source for it, so only rows that are
   * rendered pay for it.
   */

  /** @type {"timeZone" | "language" | "region"} */
  export let kind;

  /** @type {{ detail: (id: string) => any }} */
  export let source;

  /** @type {{ id: string; text: string }} */
  export let item;

  /** The locale the names are written in. */
  export let locale = "en";

  /** @type {"flag" | "badge" | "none"} */
  export let flag = "none";

  /**
   * @type {((code: string) => { readonly code: string; readonly body: string } | undefined) | undefined}
   */
  export let getFlag = undefined;

  $: detail = source.detail(item.id);
  $: secondary =
    kind === "timeZone"
      ? detail.name
      : kind === "language"
        ? detail.endonym
        : detail.nativeName;
  $: trailing =
    kind === "timeZone"
      ? detail.offsetText
      : kind === "language"
        ? item.id
        : "";
</script>

<span class:bx--intl-picker__option={true}>
  {#if kind === "region" && flag === "flag"}
    <!-- Where no flag is drawn, or none is loaded yet, `Flag` draws a box of
         the same size, so the names line up. -->
    <Flag flag={getFlag?.(item.id)} code={getFlag ? item.id : ""} />
  {:else if kind === "region" && flag === "badge"}
    <Flag code={item.id} />
  {/if}
  <span
    class:bx--intl-picker__text={true}
    lang={kind === "timeZone" ? undefined : locale}>{item.text}</span
  >
  {#if secondary}
    <span
      class:bx--intl-picker__secondary={true}
      lang={kind === "language"
        ? item.id
        : kind === "timeZone"
          ? locale
          : undefined}
      dir={kind === "language" ? detail.dir : undefined}>{secondary}</span
    >
  {/if}
  {#if trailing}
    <!-- The offset or tag reads left to right in any page. Its own span
         follows the page, so the margin that pushes it to the end does too. -->
    <span
      class:bx--intl-picker__trailing={true}
      aria-hidden={kind === "language" ? "true" : undefined}
      ><bdi dir="ltr">{trailing}</bdi></span
    >
  {/if}
</span>
