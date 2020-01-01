<script>
  import Layout from '../../internal/ui/Layout.svelte';
  import RadioButtonGroup from './RadioButtonGroup.svelte';
  import RadioButton from '../RadioButton';
  import FormGroup from '../FormGroup';

  let selected = 'default-selected';
</script>

<Layout>
  <FormGroup legendText="Radio Button heading">
    <RadioButtonGroup {...$$props.group} legend="Group Legend" bind:selected>
      <RadioButton {...$$props.radio} value="standard" id="radio-1" />
      <RadioButton {...$$props.radio} value="default-selected" id="radio-2" />
      <RadioButton {...$$props.radio} value="disabled" id="radio-3" />
    </RadioButtonGroup>
  </FormGroup>
</Layout>
