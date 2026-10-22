<script>
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<ComboBox
  titleText="Contact"
  helperText="Pick one"
  placeholder="Select contact method"
  {items}
  {...$$restProps}
/>
