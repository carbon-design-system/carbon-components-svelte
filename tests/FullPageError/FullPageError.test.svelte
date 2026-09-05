<script lang="ts">
  import FullPageError from "carbon-components-svelte/FullPageError/FullPageError.svelte";
</script>

<div data-testid="default">
  <FullPageError
    labelText="Error"
    title="Something went wrong"
    description="An unexpected error occurred."
  />
</div>

<div data-testid="kind-403">
  <FullPageError
    kind="403"
    labelText="Forbidden"
    title="Access denied"
    description="You don't have permission to view this page."
  />
</div>

<div data-testid="kind-404">
  <FullPageError
    kind="404"
    labelText="Not found"
    title="Page not found"
    description="The page you're looking for doesn't exist."
  />
</div>

<div data-testid="with-body">
  <FullPageError
    labelText="Error"
    title="Something went wrong"
    description="An unexpected error occurred."
  >
    <button type="button">Go home</button>
  </FullPageError>
</div>

<div data-testid="slottable">
  <FullPageError
    labelText="Error"
    title="Something went wrong"
    description="An unexpected error occurred."
  >
    <strong slot="labelChildren">Custom label</strong>
    <em slot="titleChildren">Custom title</em>
    <span slot="descriptionChildren" data-testid="custom-description"
      >Custom description</span
    >
  </FullPageError>
</div>

<div data-testid="slot-only">
  <FullPageError>
    <span slot="labelChildren">Slot label</span>
    <span slot="titleChildren">Slot title</span>
    <span slot="descriptionChildren">Slot description</span>
  </FullPageError>
</div>

<div data-testid="no-description">
  <FullPageError labelText="Error 404" title="Page not found" />
</div>

<div data-testid="custom-illustration">
  <FullPageError labelText="Error" title="Something went wrong">
    <svg
      slot="illustration"
      data-testid="custom-svg"
      class="bx--full-page-error__svg"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="4" />
    </svg>
  </FullPageError>
</div>
