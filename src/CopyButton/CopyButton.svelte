<script>
  /** @extends {"../Copy/Copy.svelte"} CopyProps */

  /** Set the title and ARIA label for the copy button */
  export let iconDescription = "Copy to clipboard";

  /**
   * Specify the text to copy
   * @type {string}
   */
  export let text = undefined;

  /**
   * Override the default copy behavior of using the navigator.clipboard.writeText API to copy text
   * @type {(text: string) => void}
   */
  export let copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.log(e);
    }
  };

  import Copy from "../Copy/Copy.svelte";
  import Copy16 from "../icons/Copy16.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<Copy
  class="bx--copy-btn"
  aria-label="{iconDescription}"
  title="{iconDescription}"
  {...$$restProps}
  on:click
  on:click="{() => {
    if (text !== undefined) {
      copy(text);
      dispatch('copy');
    }
  }}"
  on:animationend
>
  <Copy16 class="bx--snippet__icon" />
</Copy>
