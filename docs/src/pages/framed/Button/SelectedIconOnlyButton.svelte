<script>
  import { Button } from "carbon-components-svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";

  let index = 1;
</script>

<Button
  isSelected={index === 0}
  kind="ghost"
  iconDescription="Bold"
  icon={TextBold}
  on:click={() => (index = 0)}
/>
<Button
  isSelected={index === 1}
  kind="ghost"
  iconDescription="Italicize"
  icon={TextItalic}
  on:click={() => (index = 1)}
/>
<Button
  isSelected={index === 2}
  kind="ghost"
  iconDescription="Underline"
  icon={TextUnderline}
  on:click={() => (index = 2)}
/>
