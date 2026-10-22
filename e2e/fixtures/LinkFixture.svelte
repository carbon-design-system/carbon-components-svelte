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

<p style="color: rgb(10, 20, 30);">
  Read the
  <Link
    data-testid="link-muted"
    muted
    inline
    href="https://www.carbondesignsystem.com/"
  >
    Carbon Design System
  </Link>
  documentation.
</p>

<p style="color: rgb(10, 20, 30);">
  Read the
  <Link
    data-testid="link-default"
    inline
    href="https://www.carbondesignsystem.com/"
  >
    Carbon Design System
  </Link>
  documentation.
</p>

<p data-testid="link-wrap-container" style="width: 240px;">
  Deployment logs for this region are kept for 30 days in
  <Link
    data-testid="link-wrap"
    inline
    href="#"
    on:click={(event) => event.preventDefault()}
  >
    the observability workspace for the production cluster in us-east-1
  </Link>
  before they are archived.
</p>

<Link
  data-testid="link-press"
  href="#"
  on:click={(event) => event.preventDefault()}
>
  Pressable
</Link>

<Link data-testid="link-disabled" disabled href="#">Disabled</Link>
