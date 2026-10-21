<script lang="ts">
  import InputGroup from "carbon-components-svelte/InputGroup/InputGroup.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
</script>

<InputGroup>
  <span slot="legendChildren">Promo <em>code</em></span>
  <TextInput hideLabel labelText="Code" />
</InputGroup>
