<script>
  import Grid from "./Grid.svelte";
  import Row from "./Row.svelte";
  import Column from "./Column.svelte";
</script>

<style>
  :global(.grid div) {
    outline: 1px solid #e0e0e0;
    font-size: 0.75rem;
  }

  :global(.outside) {
    min-height: 2rem;
  }

  h6 {
    margin-top: 2.5rem;
    margin-bottom: 0.5rem;
  }
</style>

<div class="grid">
  <h6>Columns with auto-width</h6>

  <Grid>
    <Row>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
  </Grid>

  <h6>Responsive Grid</h6>

  <Grid>
    <Row>
      <Column sm={1} md={4} lg={8}>
        <div class="outside">
          <div class="inside">sm: 1/4, md: 1/2, lg: 2/3</div>
        </div>
      </Column>
      <Column sm={1} md={2} lg={2}>
        <div class="outside">
          <div class="inside">sm: 1/4, md: 1/4, lg: 1/6</div>
        </div>
      </Column>
      <Column sm={1} md={1} lg={1}>
        <div class="outside">
          <div class="inside">sm: 1/4, md: 1/8, lg: 1/12</div>
        </div>
      </Column>
      <Column sm={1} md={1} lg={1}>
        <div class="outside">
          <div class="inside">sm: 1/4, md: 1/8, lg: 1/12</div>
        </div>
      </Column>
    </Row>
  </Grid>

  <h6>Columns with Offset</h6>

  <Grid>
    <Row>
      <Column sm={{ span: 1, offset: 3 }}>
        <div class="outside">
          <div class="inside">Small Screen Offset 3</div>
        </div>
      </Column>
      <Column sm={{ span: 2, offset: 2 }}>
        <div class="outside">
          <div class="inside">Small Screen Offset 2</div>
        </div>
      </Column>
      <Column sm={{ span: 3, offset: 1 }}>
        <div class="outside">
          <div class="inside">Small Screen Offset 1</div>
        </div>
      </Column>
      <Column sm={{ span: 4, offset: 0 }}>
        <div class="outside">
          <div class="inside">Small Screen Offset 0</div>
        </div>
      </Column>
    </Row>
  </Grid>

  <h6>Condensed Grid</h6>

  <Grid condensed>
    <Row>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
  </Grid>

  <h6>Condensed Columns</h6>

  <Grid>
    <Row>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
    <Row condensed>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
    <Row>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
  </Grid>

  <h6>Full Width</h6>

  <Grid fullWidth>
    <Row>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
      <Column>
        <div class="outside">
          <div class="inside">1/4</div>
        </div>
      </Column>
    </Row>
  </Grid>
</div>
