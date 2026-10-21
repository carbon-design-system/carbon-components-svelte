<script>
  import { Dropdown, LayoutDirection } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "us-east-1" },
    { id: "1", text: "eu-west-1" },
  ];
</script>

<LayoutDirection dir="rtl">
  <Dropdown portalMenu labelText="RTL region" selectedId="0" {items} />
  <LayoutDirection dir="ltr">
    <Dropdown portalMenu labelText="LTR region" selectedId="0" {items} />
  </LayoutDirection>
</LayoutDirection>
