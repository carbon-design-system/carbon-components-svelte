<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
</script>

<FormItem controlId="plain" let:labelId let:size let:fluid>
  <FormLabel>Plain</FormLabel>
  <span data-testid="plain">{labelId}|{String(size)}|{fluid}</span>
</FormItem>

<Form size="sm">
  <FormItem controlId="sized" let:size let:fluid>
    <span data-testid="sized">{size}|{fluid}</span>
  </FormItem>
</Form>

<FluidForm>
  <FormItem controlId="fluid" let:fluid>
    <span data-testid="fluid">{fluid}</span>
  </FormItem>
</FluidForm>
