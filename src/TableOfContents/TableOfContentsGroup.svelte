<script>
  /**
   * @restProps {li}
   */

  /**
   * Specify the group label, such as "Examples".
   * Alternatively, use the named slot "labelChildren".
   */
  export let labelText = "";

  /** Set an id for the label element */
  export let id = uniqueId();

  import { getContext } from "svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";

  getContext("carbon:TableOfContents")?.registerGroup?.();

  // Naming and description belong on the nested list, not the wrapping
  // `li`. The list keeps its implicit role, so screen readers announce
  // "Examples, list, 4 items". A consumer `aria-labelledby` or `aria-label`
  // wins over the built-in label.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
</script>

<li class:bx--toc__group={true} {...rest}>
  <div {id} class:bx--toc__group-label={true}>
    <slot name="labelChildren">{labelText}</slot>
  </div>
  <ul
    aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : id)}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    class:bx--toc__group-list={true}
  >
    <slot />
  </ul>
</li>
