<script>
  import { Link } from "carbon-components-svelte";
  import Carbon from "carbon-icons-svelte/lib/Carbon.svelte";
</script>

<Link
  data-testid="link-sm"
  size="sm"
  href="https://www.carbondesignsystem.com/"
  icon={Carbon}
>
  Small
</Link>

<Link
  data-testid="link-md"
  href="https://www.carbondesignsystem.com/"
  icon={Carbon}
>
  Medium
</Link>

<Link
  data-testid="link-lg"
  size="lg"
  href="https://www.carbondesignsystem.com/"
  icon={Carbon}
>
  Large
</Link>
