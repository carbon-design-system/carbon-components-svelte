<script lang="ts">
  import { FileUploaderButton } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import DocumentAdd from "carbon-icons-svelte/lib/DocumentAdd.svelte";
</script>

<FileUploaderButton labelText="Add file" />

<FileUploaderButton
  icon={Add}
  labelText="Add file with icon"
/>

<FileUploaderButton
  icon={Add}
  iconDescription="Add file icon only"
  labelText=""
/>

<FileUploaderButton
  icon={Add}
  iconDescription="Tooltip text"
  tooltipPosition="bottom"
  tooltipAlignment="center"
  labelText=""
/>

<FileUploaderButton
  icon={Add}
  hideTooltip
  iconDescription="Add item hidden tooltip"
  labelText=""
/>

<FileUploaderButton
  icon={DocumentAdd}
  iconDescription="Upload document"
  labelText=""
/>

<FileUploaderButton
  icon={Add}
  iconDescription="Add file tooltip right"
  tooltipPosition="right"
  tooltipAlignment="end"
  labelText=""
/>

<FileUploaderButton
  icon={Add}
  labelText="Upload file"
/>
