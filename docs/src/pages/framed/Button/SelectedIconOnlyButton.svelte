<script>
  import { Button } from "carbon-components-svelte";
  import TextBold16 from "carbon-icons-svelte/lib/TextBold16";
  import TextItalic16 from "carbon-icons-svelte/lib/TextItalic16";
  import TextUnderline16 from "carbon-icons-svelte/lib/TextUnderline16";

  let index = 1;
</script>

<Button
  isSelected="{index === 0}"
  kind="ghost"
  iconDescription="Bold"
  icon="{TextBold16}"
  on:click="{() => (index = 0)}"
/>
<Button
  isSelected="{index === 1}"
  kind="ghost"
  iconDescription="Italicize"
  icon="{TextItalic16}"
  on:click="{() => (index = 1)}"
/>
<Button
  isSelected="{index === 2}"
  kind="ghost"
  iconDescription="Underline"
  icon="{TextUnderline16}"
  on:click="{() => (index = 2)}"
/>
