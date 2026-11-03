<script>
  import { Mentions, TextArea, UserAvatar } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const people = [
    { id: "u-1042", text: "Priya Raman", secondary: "Platform engineering" },
    { id: "u-2290", text: "Marcus Oyelaran", secondary: "Site reliability" },
    { id: "u-3118", text: "Hannah Lindqvist", secondary: "Security" },
    { id: "u-4501", text: "Tomás Herrera", secondary: "Data platform" },
  ];
</script>

<TextArea bind:ref bind:value labelText="Comment" />
<Mentions field={ref} size="lg" triggers={[{ char: "@", items: people }]}>
  <svelte:fragment let:item>
    <UserAvatar name={item.text} size="sm" backgroundColor="auto" />
    <span class="bx--mentions__text">{item.text}</span>
    <span class="bx--mentions__secondary">{item.secondary}</span>
  </svelte:fragment>
</Mentions>
