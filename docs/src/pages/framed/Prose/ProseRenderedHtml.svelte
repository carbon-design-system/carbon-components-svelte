<script>
  import { Prose } from "carbon-components-svelte";

  // HTML from a Markdown renderer or a CMS. Only render HTML you trust or
  // have sanitized.
  const html = `<h3>Release notes</h3>
<p>This release adds <strong>scheduled exports</strong> and fixes two bugs in the usage chart.</p>
<ul>
  <li>Exports run daily or weekly and land in your storage bucket.</li>
  <li>The chart no longer drops the last day of the month.</li>
</ul>
<p>See the <a href="#rendered-html">export guide</a> to set one up.</p>`;
</script>

<Prose> {@html html} </Prose>
