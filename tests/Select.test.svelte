<script lang="ts">
  import {
    Select,
    SelectItem,
    SelectItemGroup,
    SelectSkeleton,
  } from "../types";
</script>

<Select labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<Select labelText="Carbon theme" selected="{0}">
  <SelectItem value="{0}" text="Select a theme" disabled hidden />
  <SelectItemGroup label="Light theme">
    <SelectItem value="white" text="White" />
    <SelectItem value="g10" text="Gray 10" />
  </SelectItemGroup>
  <SelectItemGroup label="Dark theme">
    <SelectItem value="g90" text="Gray 90" />
    <SelectItem value="g100" text="Gray 100" />
  </SelectItemGroup>
</Select>

<Select light labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<Select inline labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<Select size="xl" labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<Select size="sm" labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<Select disabled labelText="Carbon theme" selected="g10">
  <SelectItem value="white" text="White" />
  <SelectItem value="g10" text="Gray 10" />
  <SelectItem value="g90" text="Gray 90" />
  <SelectItem value="g100" text="Gray 100" />
</Select>

<SelectSkeleton />
