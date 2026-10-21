<script>
  import {
    Dropdown,
    Layer,
    TextInput,
    ThemeZone,
  } from "carbon-components-svelte";

  // `?page=g100` sets the page theme the zones sit in.
  const page = new URLSearchParams(window.location.search).get("page");
  if (page) document.documentElement.setAttribute("theme", page);

  const items = [
    { id: "0", text: "us-east-1" },
    { id: "1", text: "eu-west-1" },
  ];
</script>

<ThemeZone theme="g100" data-testid="outer" style="padding: 1rem">
  <TextInput labelText="Outer field" />
  <Dropdown portalMenu labelText="Outer region" selectedId="0" {items} />
  <ThemeZone theme="g10" data-testid="inner" style="padding: 1rem">
    <TextInput labelText="Inner field" />
    <Layer>
      <TextInput labelText="Inner layer field" />
    </Layer>
    <Dropdown portalMenu labelText="Inner region" selectedId="0" {items} />
  </ThemeZone>
</ThemeZone>
