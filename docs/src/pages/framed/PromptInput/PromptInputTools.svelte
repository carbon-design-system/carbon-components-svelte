<script>
  import { MenuButton, MenuItem, PromptInput } from "carbon-components-svelte";

  let model = "Granite 4";
  let value = "";
</script>

<PromptInput
  placeholder="Ask about your deployments"
  maxCount={2000}
  hint={(text) => `~${Math.ceil(text.length / 4)} tokens`}
  bind:value
>
  <MenuButton slot="tools" kind="ghost" size="sm" labelText={model}>
    <MenuItem on:click={() => (model = "Granite 4")}>Granite 4</MenuItem>
    <MenuItem on:click={() => (model = "Granite 4 Tiny")}>
      Granite 4 Tiny
    </MenuItem>
    <MenuItem on:click={() => (model = "Llama 4")}>Llama 4</MenuItem>
  </MenuButton>
</PromptInput>
