<script>
  /**
   * @restProps {div}
   * @slot {{}} logo - A mark for the center of the code, such as a product icon. Needs `ecc="H"`.
   * @slot {{ text: string }} textAlternative - How the text alternative reads. The copy button still copies `text`. Defaults to `text`.
   */

  /**
   * Specify the text to encode: a URL, an `otpauth://` URI, a Wi-Fi
   * payload. Nothing renders while it is empty.
   * @type {string}
   */
  export let value = "";

  /**
   * Specify the error correction level. Higher levels survive more damage
   * and need a larger code. Defaults to `"H"` when the `logo` slot is used
   * and `"M"` otherwise.
   * @type {"L" | "M" | "Q" | "H" | undefined}
   */
  export let ecc = undefined;

  /**
   * Specify the width and height of the code, with its quiet zone, in
   * pixels. The code shrinks to fit a narrower parent.
   */
  export let size = 192;

  /**
   * Specify the quiet zone in modules, the light border that scanners need
   * around the code. The ISO 18004 minimum is `4`.
   */
  export let quietZone = 4;

  /**
   * Describe what the code is for, not its data, such as "Scan to set up
   * two-factor authentication". Screen readers announce it as an image.
   */
  export let labelText = "QR code";

  /**
   * Specify the text alternative. Defaults to `value`. Use it when the
   * payload is not what a person would type, such as the secret key
   * inside an `otpauth://` URI.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify where the text alternative goes. `"copy"` shows `text` with a
   * copy button under the code, `"disclosure"` tucks it behind
   * `alternativeLabel`, and `"none"` leaves it to you: pair the code with
   * your own text, because a code alone cannot be read without a camera.
   * @type {"copy" | "disclosure" | "none"}
   */
  export let alternative = "copy";

  /** Specify the label above the text alternative, or on the disclosure */
  export let alternativeLabel = "Can't scan? Copy the text instead";

  /**
   * Specify the width of the `logo` slot as a share of the code, up to
   * `0.3`. The modules behind it are left out, and error correction fills
   * them back in.
   */
  export let logoSize = 0.2;

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";
  import CopyText from "../CopyText/CopyText.svelte";
  import Disclosure from "../Disclosure/Disclosure.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { encodeQR, qrPath } from "./qr-encode.js";

  let mounted = false;
  onMount(() => {
    mounted = true;
  });

  // Naming and description belong on the image, not the wrapper.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  // The text alternative first, then any ids the consumer adds.
  $: describedBy =
    [alternative === "none" ? "" : textId, ariaDescribedBy]
      .filter(Boolean)
      .join(" ") || undefined;

  $: hasLogo = !!$$slots.logo;
  $: level = ecc ?? (hasLogo ? "H" : "M");
  $: textId = `${id}-text`;
  $: alternativeValue = text ?? value;

  /**
   * @param {string} value
   * @param {"L" | "M" | "Q" | "H"} level
   */
  function build(value, level) {
    if (!value) return { qr: null, error: "" };
    try {
      return { qr: encodeQR(value, level), error: "" };
    } catch (e) {
      return { qr: null, error: e instanceof Error ? e.message : String(e) };
    }
  }

  $: ({ qr, error } = build(value, level));

  $: logoShare = Math.min(Math.max(logoSize, 0), 0.3);
  $: hole = (() => {
    if (!qr || !hasLogo) return 0;
    const side = Math.round(qr.size * logoShare);
    // Center it on the module grid.
    return (qr.size - side) % 2 ? side + 1 : side;
  })();
  $: path = qr ? qrPath(qr, { border: quietZone, hole }) : "";
  $: span = qr ? qr.size + quietZone * 2 : 0;

  $: if (mounted && error) console.warn(error);
  $: if (mounted && hasLogo && level !== "H") {
    console.warn(
      `QRCode: a logo covers part of the code and needs ecc="H", got "${level}". The code may not scan.`,
    );
  }
</script>

<div bind:this={ref} {id} class:bx--qr-code={true} {...wrapperProps}>
  {#if qr}
    <div class:bx--qr-code__symbol={true}>
      <svg
        class:bx--qr-code__svg={true}
        role="img"
        aria-label={ariaLabel ?? labelText}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 {span} {span}"
        width={size}
        height={size}
      >
        <path
          class:bx--qr-code__path={true}
          d={path}
          shape-rendering="crispEdges"
        />
      </svg>
      {#if hasLogo}
        <div class:bx--qr-code__logo={true}>
          <div
            class:bx--qr-code__logo-plate={true}
            style:inline-size="{(hole / span) * 100}%"
            style:block-size="{(hole / span) * 100}%"
          >
            <slot name="logo" />
          </div>
        </div>
      {/if}
    </div>
  {/if}
  {#if value && alternative !== "none"}
    {#if alternative === "disclosure"}
      <Disclosure summary={alternativeLabel} align="start">
        <CopyText text={alternativeValue}>
          <span id={textId}
            ><slot name="textAlternative" text={alternativeValue}
              >{alternativeValue}</slot
            ></span
          >
        </CopyText>
      </Disclosure>
    {:else}
      <div class:bx--qr-code__alternative={true}>
        <p class:bx--qr-code__alternative-label={true}>{alternativeLabel}</p>
        <CopyText text={alternativeValue}>
          <span id={textId}
            ><slot name="textAlternative" text={alternativeValue}
              >{alternativeValue}</slot
            ></span
          >
        </CopyText>
      </div>
    {/if}
  {/if}
</div>
