<script>
  // Renders different text, `href` and `class` on the server and the client.
  const side = typeof window === "undefined" ? "server" : "client";
</script>

<p>{side}</p>
<a href="/{side}">link</a>
<p class={side}>class</p>
