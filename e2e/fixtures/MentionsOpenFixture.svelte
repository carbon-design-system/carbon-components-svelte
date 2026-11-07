<script>
  import { Mentions, TextArea } from "carbon-components-svelte";
  import { onMount, tick } from "svelte";

  const users = [
    { id: "u1", text: "Alice Johnson", secondary: "@alice" },
    { id: "u2", text: "Alina Petrova", secondary: "@alina" },
    {
      id: "u3",
      text: "Alicia Keys-Rodriguez de la Vega Fernandez",
      secondary: "@alicia",
    },
    { id: "u4", text: "Ali", secondary: "@ali", disabled: true },
  ];

  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let value = "Thanks for the review @ali";

  // Opens the menu the way typing does, so the sweep sees it open.
  onMount(async () => {
    await tick();
    if (!ref) return;
    ref.focus();
    ref.setSelectionRange(value.length, value.length);
    ref.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
</script>

<TextArea
  bind:ref
  bind:value
  labelText="Comment"
  helperText="Type @ to mention a teammate"
  rows={4}
/>
<Mentions field={ref} triggers={[{ char: "@", items: users }]}>
  <svelte:fragment let:item>
    <span class="bx--mentions__text">{item.text}</span>
    <span class="bx--mentions__secondary">{item.secondary}</span>
  </svelte:fragment>
</Mentions>
