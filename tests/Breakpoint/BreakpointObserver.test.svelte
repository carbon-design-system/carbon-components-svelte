<script lang="ts">
import { breakpointObserver } from "carbon-components-svelte";

export let smallerThanMd = false;
export let largerThanMd = false;

const observer = breakpointObserver();
const smallerThan = observer.smallerThan("md");
const largerThan = observer.largerThan("md");

smallerThan.subscribe((value) => {
  smallerThanMd = value;
});

largerThan.subscribe((value) => {
  largerThanMd = value;
});
</script>

<div data-testid="smaller-than-md">{smallerThanMd}</div>
<div data-testid="larger-than-md">{largerThanMd}</div>
