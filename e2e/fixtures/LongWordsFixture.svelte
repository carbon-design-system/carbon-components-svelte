<script>
  import {
    Accordion,
    AccordionItem,
    Button,
    Checkbox,
    InlineNotification,
    Link,
    RadioButton,
    TextInput,
    Tile,
    ToastNotification,
    Toggle,
  } from "carbon-components-svelte";

  const word = "Datenschutzgrundverordnungskonformitätsprüfung";
  const url = "https://api.example.com/v2/organizations/8f14e45fceea167a";
</script>

<div data-testid="column" style="width: 12rem">
  <TextInput labelText={word} helperText={url} />
  <Checkbox labelText={word} />
  <RadioButton labelText={url} value="a" />
  <Toggle labelText={word} />
  <Accordion><AccordionItem title={word}>Body</AccordionItem></Accordion>
  <Tile>{url}</Tile>
  <p><Link href="/">{url}</Link></p>
  <Button>{word}</Button>
</div>

<!-- Notifications keep an 18rem minimum width. -->
<div data-testid="wide" style="width: 20rem">
  <InlineNotification kind="info" title={word} subtitle={url} hideCloseButton />
  <ToastNotification
    kind="info"
    title={word}
    subtitle={url}
    caption={url}
    hideCloseButton
    timeout={0}
  />
</div>
