<script>
  /**
   * @extendProps {"svelte/elements"} HTMLAttributes<HTMLSpanElement>
   * @restProps {span}
   */

  /**
   * Specify the text to render. URLs and email addresses in it become links;
   * everything else, including anything that looks like markup, stays text.
   * @type {string | null | undefined}
   */
  export let text = "";

  /**
   * Specify the URL schemes that become links, with or without the colon.
   * `javascript:`, `vbscript:` and `data:` are never linked.
   * @type {ReadonlyArray<string>}
   */
  export let protocols = ["http", "https", "mailto"];

  /** Set to `false` to leave bare email addresses as text. */
  export let emails = true;

  /**
   * Specify where links open, such as `"_blank"`.
   * @type {"_blank" | "_self" | "_parent" | "_top" | undefined}
   */
  export let target = undefined;

  /**
   * Specify the `rel` of every link.
   * The default keeps the destination from reaching back to the page or
   * seeing where it came from, and denies search engines the link.
   */
  export let rel = "noopener noreferrer nofollow";

  import Link from "../Link/Link.svelte";
  import { linkify } from "../utils/linkify.js";
  import { linkLabel } from "../utils/safe-url.js";

  /**
   * A link shows its own text, unless that text names its host in a form
   * a reader could mistake for another site; then it shows the real address.
   * @param {import("../utils/linkify.js").LinkifySegment[]} parts
   */
  function toView(parts) {
    return parts.map((part) => {
      if (part.type === "text") return part;
      const label = linkLabel(part.text, part.href);
      return {
        ...part,
        text: label.mismatch ? label.display : label.text,
      };
    });
  }

  $: segments = toView(linkify(text, { protocols, emails }));
</script>

<!-- No whitespace between the nodes: it would render as text. -->
<!-- prettier-ignore -->
<span {...$$restProps}>{#each segments as segment, index (index)}{#if segment.type === "link"}<Link inline href={segment.href} {target} {rel} dir="ltr">{segment.text}</Link>{:else}{segment.text}{/if}{/each}</span>
