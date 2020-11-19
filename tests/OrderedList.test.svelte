<script lang="ts">
  import { OrderedList, ListItem, Link } from "../types";
</script>

<OrderedList>
  <ListItem>Ordered list item</ListItem>
  <ListItem>Ordered list item</ListItem>
  <ListItem>Ordered list item</ListItem>
</OrderedList>

<OrderedList>
  <ListItem>
    <Link href="#">Ordered list item</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Ordered list item</Link>
  </ListItem>
  <ListItem>
    <Link href="#">Ordered list item</Link>
  </ListItem>
</OrderedList>

<OrderedList>
  <ListItem>
    Ordered list level 1
    <OrderedList nested>
      <ListItem>Ordered list level 2</ListItem>
      <ListItem>
        Ordered list level 3
        <OrderedList nested>
          <ListItem>Ordered list level 3</ListItem>
          <ListItem>Ordered list level 3</ListItem>
        </OrderedList>
      </ListItem>
    </OrderedList>
  </ListItem>
  <ListItem>Ordered list level 1</ListItem>
  <ListItem>Ordered list level 1</ListItem>
</OrderedList>

<OrderedList native>
  <ListItem>
    Ordered list level 1
    <OrderedList nested>
      <ListItem>Ordered list level 2</ListItem>
      <ListItem>
        Ordered list level 3
        <OrderedList nested>
          <ListItem>Ordered list level 3</ListItem>
          <ListItem>Ordered list level 3</ListItem>
        </OrderedList>
      </ListItem>
    </OrderedList>
  </ListItem>
  <ListItem>Ordered list level 1</ListItem>
  <ListItem>Ordered list level 1</ListItem>
</OrderedList>
