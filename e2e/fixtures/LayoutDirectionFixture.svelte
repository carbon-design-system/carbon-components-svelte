<script>
  import { Dropdown, LayoutDirection, Slider } from "carbon-components-svelte";

  const items = [
    { id: "0", text: "us-east-1" },
    { id: "1", text: "eu-west-1" },
  ];
</script>

<LayoutDirection dir="rtl">
  <Slider labelText="Replicas" min={0} max={10} value={2} />
  <Dropdown portalMenu labelText="RTL region" selectedId="0" {items} />
  <LayoutDirection dir="ltr">
    <Dropdown portalMenu labelText="LTR region" selectedId="0" {items} />
  </LayoutDirection>
</LayoutDirection>

<div dir="rtl">
  <Slider labelText="Plain RTL replicas" min={0} max={10} value={2} />
</div>

<Slider labelText="LTR replicas" min={0} max={10} value={2} />
