<script>
  import { createInputLayer, TextInput } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const DOMAINS = ["gmail.com", "icloud.com", "outlook.com"];

  /**
   * The rest of a domain the text is the start of, if the caret is at the end.
   * @param {string} value
   */
  function suggest(value) {
    const at = value.indexOf("@");
    if (at === -1) return "";
    const typed = value.slice(at + 1).toLowerCase();
    const domain = DOMAINS.find((d) => d.startsWith(typed) && d !== typed);
    return domain ? domain.slice(typed.length) : "";
  }

  /** @type {null | HTMLInputElement} */
  let ref = null;
  let value = "ada@gm";
  let layer = null;
  let ghost = "";

  onMount(() => {
    layer = createInputLayer(ref, {
      position: "above",
      // The suggestion is drawn after the value and is not part of it.
      segments: (text) => [
        { text },
        { text: ghost, className: "ghost", ghost: true },
      ],
    });
    return () => layer.destroy();
  });

  /** @param {string} next */
  function refresh(next) {
    ghost = suggest(next);
    layer?.update();
    // Latin text in a right to left field would be pushed aside: show nothing.
    if (ghost && layer?.ghostShifts()) {
      ghost = "";
      layer.update();
    }
  }

  $: refresh(value);

  /** @param {KeyboardEvent} event */
  function accept(event) {
    if (event.key !== "Tab" || !ghost) return;
    event.preventDefault();
    value += ghost;
  }
</script>

<TextInput
  labelText="Email"
  helperText="Tab accepts the suggestion"
  bind:ref
  bind:value
  on:keydown={accept}
/>

<style>
  :global(.ghost) {
    color: var(--cds-text-helper);
  }
</style>
