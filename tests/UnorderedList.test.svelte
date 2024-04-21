<script lang="ts">
  import { UnorderedList, ListItem } from "../types";
</script>

<UnorderedList expressive class="">
  <ListItem>Unordered list item</ListItem>
  <UnorderedList nested>
    <ListItem>Unordered list level 2</ListItem>
    <ListItem>
      Unordered list level 3
      <UnorderedList nested>
        <ListItem>Unordered list level 3</ListItem>
      </UnorderedList>
    </ListItem>
  </UnorderedList>
</UnorderedList>
