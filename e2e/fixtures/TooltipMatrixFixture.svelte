<script>
  // Renders the full direction x alignment matrix for every component that
  // includes the `tooltip--trigger` / `tooltip--placement` mixins (see
  // css/vendor/carbon-components/scss/globals/scss/_tooltip.scss), so a CSS
  // refactor of those mixins can be verified byte-for-byte via
  // e2e/cascade-snapshot.ts. Imported by direct path, like the other
  // fixtures that don't need the full barrel.
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";
  import TooltipDefinition from "carbon-components-svelte/TooltipDefinition/TooltipDefinition.svelte";
  import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";

  const directions4 = ["top", "right", "bottom", "left"];
  // TooltipDefinition only supports top/bottom, matching upstream Carbon.
  const directions2 = ["top", "bottom"];
  const aligns = ["start", "center", "end"];
</script>

<section data-testid="tooltip-definition-matrix">
  {#each directions2 as direction (direction)}
    {#each aligns as align (align)}
      <TooltipDefinition
        data-testid="td-{direction}-{align}"
        tooltipText="Definition tooltip {direction}/{align}"
        {direction}
        {align}
      >
        Trigger {direction}/{align}
      </TooltipDefinition>
    {/each}
  {/each}
</section>

<section data-testid="tooltip-icon-matrix">
  {#each directions4 as direction (direction)}
    {#each aligns as align (align)}
      <TooltipIcon
        data-testid="ti-{direction}-{align}"
        tooltipText="Icon tooltip {direction}/{align}"
        icon={Information}
        {direction}
        {align}
      />
    {/each}
  {/each}
</section>

<section data-testid="button-icon-only-matrix">
  {#each directions4 as tooltipPosition (tooltipPosition)}
    {#each aligns as tooltipAlignment (tooltipAlignment)}
      <Button
        data-testid="btn-{tooltipPosition}-{tooltipAlignment}"
        icon={Information}
        iconDescription="Button {tooltipPosition}/{tooltipAlignment}"
        {tooltipPosition}
        {tooltipAlignment}
      />
    {/each}
  {/each}
</section>

<section data-testid="password-input-matrix">
  {#each directions4 as tooltipPosition (tooltipPosition)}
    {#each aligns as tooltipAlignment (tooltipAlignment)}
      <PasswordInput
        data-testid="pw-{tooltipPosition}-{tooltipAlignment}"
        labelText="Password {tooltipPosition}/{tooltipAlignment}"
        {tooltipPosition}
        {tooltipAlignment}
      />
    {/each}
  {/each}
</section>

<section data-testid="copy-button-matrix">
  <!--
    CopyButton portals its tooltip by default; only an explicit
    `portalTooltip={false}` renders the CSS-only trigger this fixture is
    covering. Its own SCSS never varies by position/alignment (always
    bottom/center), so a single instance exercises the whole rule.
  -->
  <CopyButton data-testid="copy-button" portalTooltip={false} />
</section>

<section data-testid="code-snippet-matrix">
  <!-- Same portalTooltip default as CopyButton; each `type` renders its own
       markup and CSS-only caret/feedback rules. -->
  <CodeSnippet
    data-testid="snippet-single"
    type="single"
    code="npm install carbon-components-svelte"
    portalTooltip={false}
  />
  <CodeSnippet
    data-testid="snippet-multi"
    type="multi"
    code={"line one\nline two\nline three"}
    portalTooltip={false}
  />
  <CodeSnippet
    data-testid="snippet-inline"
    type="inline"
    code="npm install"
    portalTooltip={false}
  />
</section>

<section data-testid="tooltip-nested-trigger">
  <!--
    The `--cds-tooltip-*` custom properties written by the direction x
    alignment modifier classes (see css/vendor/carbon-components/scss/
    globals/scss/_tooltip.scss's `tooltip--geometry-*` mixins) inherit down
    the DOM tree like any custom property. A trigger nested inside another
    trigger's subtree could pick up the ancestor's values for any var its
    own rules don't set. The outer trigger below is `direction="left"`; the
    inner one (raw markup carrying the real trigger classes, not a second
    component instance - the components here are all `<button>`s, which
    can't validly nest) is `top`/`align-start`. If any leaf rule ever
    regressed to a partial custom-property set instead of the complete one
    each leaf writes today, this inner element's geometry would drift
    toward the outer's `left` values instead of its own `top` ones - the
    cascade-snapshot equivalence check asserts against this fixture.
  -->
  <TooltipIcon
    data-testid="ti-nested-outer"
    tooltipText="Outer (left)"
    icon={Information}
    direction="left"
  >
    <svelte:fragment slot="tooltipText">
      Outer (left)
      <span
        class="bx--tooltip__trigger bx--tooltip--top bx--tooltip--align-start"
        data-testid="nested-inner-probe"
      >
        Inner probe (top/start)
      </span>
    </svelte:fragment>
  </TooltipIcon>
</section>
