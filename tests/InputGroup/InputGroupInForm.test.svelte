<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import InputGroup from "carbon-components-svelte/InputGroup/InputGroup.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
</script>

<Form size="sm">
  <InputGroup labelText="Promo code">
    <TextInput hideLabel labelText="Code" />
    <Button kind="tertiary">Apply</Button>
  </InputGroup>
</Form>
