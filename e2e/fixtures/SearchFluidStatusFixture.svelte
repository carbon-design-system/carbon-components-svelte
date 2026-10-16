<script>
  import { Search, TextInput } from "carbon-components-svelte";
</script>

<!-- Fluid Search in each status, beside a fluid TextInput for comparison. -->
<div
  style="display: grid; grid-template-columns: repeat(3, 280px); gap: 2rem; padding: 1rem;"
>
  <div data-testid="search-invalid">
    <Search
      fluid
      labelText="Search"
      value="billing"
      invalid
      invalidText="Fix this value"
    />
  </div>
  <div data-testid="search-warn">
    <Search
      fluid
      labelText="Search"
      value="billing"
      warn
      warnText="Check this value"
    />
  </div>
  <div data-testid="text-input-invalid">
    <TextInput
      fluid
      labelText="Project name"
      value="billing"
      invalid
      invalidText="Fix this value"
    />
  </div>
  <div data-testid="search-invalid-empty">
    <Search fluid labelText="Search" invalid invalidText="Fix this value" />
  </div>
  <div data-testid="search-plain">
    <Search fluid labelText="Search" value="billing" />
  </div>
</div>
