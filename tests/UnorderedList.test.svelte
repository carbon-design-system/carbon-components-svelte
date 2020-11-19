<script lang="ts">
  import { UnorderedList, ListItem, Link } from "../types";
</script>

<UnorderedList>
  <ListItem>Unordered list item</ListItem>
  <ListItem>Unordered list item</ListItem>
  <ListItem>Unordered list item</ListItem>
</UnorderedList>

<UnorderedList>
  <ListItem>
    <Link href="#">Unordered list item</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Unordered list item</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Unordered list item</Link>
  </ListItem>
</UnorderedList>

<UnorderedList>
  <ListItem>
    Unordered list level 1
    <UnorderedList nested>
      <ListItem>Unordered list level 2</ListItem>
      <ListItem>
        Unordered list level 3
        <UnorderedList nested>
          <ListItem>Unordered list level 3</ListItem>
          <ListItem>Unordered list level 3</ListItem>
        </UnorderedList>
      </ListItem>
    </UnorderedList>
  </ListItem>
  <ListItem>Unordered list level 1</ListItem>
  <ListItem>Unordered list level 1</ListItem>
</UnorderedList>
