<script>
  import { TokenSearch } from "carbon-components-svelte";
  import { onMount, tick } from "svelte";

  const keys = [
    {
      key: "author",
      // An avatar's 1px outline nests in the menu's 2px one under forced
      // colors; the closed fixture shows the avatars.
      type: "enum",
      values: [
        { value: "alice", label: "Alice Johnson", description: "@alice" },
        { value: "alina", label: "Alina Petrova", description: "@alina" },
        {
          value: "alicia",
          label: "Alicia Keys-Rodriguez de la Vega Fernandez",
          description: "@alicia",
        },
      ],
    },
  ];

  /** @type {null | HTMLInputElement} */
  let ref = null;
  let value = 'is:open -label:bug nope:1 "exact phrase" author:ali';

  // Opens the menu the way typing does, so the sweep sees it open.
  onMount(async () => {
    await tick();
    if (!ref) return;
    ref.focus();
    ref.setSelectionRange(value.length, value.length);
    ref.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
</script>

<TokenSearch
  bind:ref
  bind:value
  {keys}
  labelText="Search issues"
  helperText="Try author: or is:open"
/>
