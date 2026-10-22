<script>
  import {
    ListItem,
    OrderedList,
    UnorderedList,
  } from "carbon-components-svelte";
</script>

<!-- Clips like a scroll container, so a marker past the edge is cut off. -->
<div style="overflow: hidden;">
  <UnorderedList data-testid="unordered">
    <ListItem>
      Workspace settings
      <UnorderedList nested data-testid="unordered-nested">
        <ListItem>Billing</ListItem>
      </UnorderedList>
    </ListItem>
  </UnorderedList>

  <OrderedList data-testid="ordered">
    <ListItem>Create a project</ListItem>
  </OrderedList>

  <OrderedList native data-testid="ordered-native">
    <ListItem>Invite your team</ListItem>
  </OrderedList>
</div>
