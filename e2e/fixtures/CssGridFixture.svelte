<script>
  import { CssColumn, CssGrid } from "carbon-components-svelte";
</script>

<CssGrid data-testid="grid">
  <CssColumn
    data-testid="offset"
    sm={2}
    md={{ span: 4, offset: 2 }}
    lg={{ start: 3, end: 7 }}
  >
    Offset
  </CssColumn>
  <CssColumn data-testid="percent" sm={2} md={2} lg="25%">Percent</CssColumn>
  <CssColumn data-testid="full" span="100%">Full</CssColumn>
  <CssColumn data-testid="hidden" sm={0} md={4} lg={{ span: 4, start: 13 }}>
    Hidden at sm
  </CssColumn>
  <CssColumn data-testid="host" sm={4} md={8} lg={8}>
    <CssGrid>
      <CssColumn data-testid="sub" span={2}>Subgrid</CssColumn>
    </CssGrid>
  </CssColumn>
</CssGrid>

<CssGrid narrow data-testid="narrow">
  <CssColumn data-testid="narrow-col" sm={2} md={4} lg={4}>Narrow</CssColumn>
</CssGrid>

<div data-testid="wrapper">
  <CssGrid data-testid="wide-grid" withRowGap>
    <CssColumn data-testid="wide-grid-col" sm={4} md={4} lg={4}>
      <p data-testid="wide-grid-hang" class="bx--grid-column-hang">Wide</p>
      <CssGrid data-testid="subgrid" withRowGap>
        <CssColumn data-testid="subgrid-col" span={2}>Subgrid</CssColumn>
      </CssGrid>
    </CssColumn>
  </CssGrid>
  <CssGrid narrow withRowGap data-testid="narrow-grid">
    <CssColumn data-testid="narrow-grid-col" span={2}>
      <p data-testid="narrow-grid-hang" class="bx--grid-column-hang">Narrow</p>
    </CssColumn>
  </CssGrid>
  <CssGrid condensed withRowGap data-testid="condensed-grid">
    <CssColumn data-testid="condensed-grid-col" span={2}>
      <p data-testid="condensed-grid-hang" class="bx--grid-column-hang">
        Condensed
      </p>
    </CssColumn>
  </CssGrid>
</div>

<CssGrid data-testid="align-grid">
  <CssColumn data-testid="align-tall" span={2} style="block-size: 10rem">
    Tall
  </CssColumn>
  <CssColumn data-testid="align-default" span={2}>Default</CssColumn>
  <CssColumn data-testid="align-start" span={2} align="start">Start</CssColumn>
  <CssColumn data-testid="align-center" span={2} align="center">
    Center
  </CssColumn>
  <CssColumn data-testid="align-end" span={2} align="end">End</CssColumn>
  <CssColumn data-testid="align-stretch" span={2} align="stretch">
    Stretch
  </CssColumn>
</CssGrid>
