<script>
  import {
    ChatMessage,
    Checkbox,
    SearchMenu,
    SearchMenuItem,
    TableOfContents,
    TableOfContentsItem,
    Toggletip,
  } from "carbon-components-svelte";
</script>

<Checkbox labelText="Checkbox" />
<Checkbox labelText="Disabled checkbox" disabled />
<Checkbox labelText="Disabled checked checkbox" disabled checked />

<TableOfContents selectedId="active" noScrollSpy>
  <TableOfContentsItem href="#plain" text="Plain" />
  <TableOfContentsItem href="#active" text="Active" />
</TableOfContents>

<ul style="list-style: none; padding: 0;">
  <ChatMessage from="them">Agent</ChatMessage>
  <ChatMessage from="me">Me</ChatMessage>
  <ChatMessage from="them" typing />
  <ChatMessage from="them" streaming>Streaming agent</ChatMessage>
  <ChatMessage from="me" streaming>Streaming me</ChatMessage>
</ul>

<SearchMenu labelText="Search menu">
  <SearchMenuItem text="Result" />
  <SearchMenuItem text="Disabled result" disabled />
  <SearchMenuItem text="Other result" />
</SearchMenu>

<div style="height: 8rem;">
  <Toggletip labelText="Toggletip">Closed</Toggletip>
  <Toggletip labelText="Open toggletip" open>Open</Toggletip>
</div>
