<script>
  import { Layer } from "carbon-components-svelte";
</script>

<Layer>
  <p>First layer</p>
  <Layer>
    <p>Second layer</p>
    <Layer>
      <p>Third layer</p>
    </Layer>
  </Layer>
</Layer>
