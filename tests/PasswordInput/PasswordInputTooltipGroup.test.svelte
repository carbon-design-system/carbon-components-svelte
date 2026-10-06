<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
</script>

<TooltipGroup>
  <Button kind="ghost" icon={Edit} iconDescription="Edit" />
  <PasswordInput labelText="Password" />
</TooltipGroup>
