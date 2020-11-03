<script lang="ts">
  // example of a base import
  import { Tag } from "../types";

  // example of a direct import
  import TagSkeleton from "../types/Tag/Tag.Skeleton";
</script>

<!-- the "class", "style" attributes should not cause an error -->
<Tag
  class="class-name"
  style="color: red;"
  type="red"
  on:click="{(e) => {
    console.log(e);
  }}"
>
  text
</Tag>

<TagSkeleton class="class-name" style="color: red;" />
