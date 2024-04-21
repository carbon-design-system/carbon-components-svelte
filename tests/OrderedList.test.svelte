<script lang="ts">
  import { OrderedList, ListItem } from "../types";
</script>

<OrderedList native expressive class="">
  <ListItem>Ordered list item</ListItem>
  <OrderedList nested>
    <ListItem>Ordered list level 2</ListItem>
    <ListItem>
      Ordered list level 3
      <OrderedList nested>
        <ListItem>Ordered list level 3</ListItem>
      </OrderedList>
    </ListItem>
  </OrderedList>
</OrderedList>
