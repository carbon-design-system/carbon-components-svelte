<script>
  // Throws during init on the client only.
  if (typeof window !== "undefined") throw new Error("boom on client");
</script>

<p>client throws</p>
