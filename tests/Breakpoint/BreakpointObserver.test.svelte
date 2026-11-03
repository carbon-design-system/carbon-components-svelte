<script lang="ts">
  import { breakpointObserver } from "carbon-components-svelte/Breakpoint/breakpoint-observer";

  export let smallerThanMd = false;
  export let largerThanMd = false;
  export let fallback: "sm" | "md" | "lg" | "xlg" | "max" | undefined =
    undefined;

  export let compareTo: "sm" | "md" | "lg" | "xlg" | "max" = "md";

  const observer = breakpointObserver({ fallback });
  const smallerThan = observer.smallerThan(compareTo);
  const largerThan = observer.largerThan(compareTo);

  smallerThan.subscribe((value) => {
    smallerThanMd = value;
  });

  largerThan.subscribe((value) => {
    largerThanMd = value;
  });
</script>

<div data-testid="smaller-than-md">{smallerThanMd}</div>
<div data-testid="larger-than-md">{largerThanMd}</div>
