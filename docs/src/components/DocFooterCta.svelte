<script lang="ts">
  import { Column, Grid, Row, Stack, Text } from "carbon-components-svelte";

  export let title = "";
  export let description = "";
  export let descriptionMaxWidth = "48ch";
</script>

<section class="footer-cta">
  <Grid>
    <Row>
      <Column lg={10} xlg={8}>
        <Stack gap={7}>
          <Stack gap={2}>
            <Text tag="h2" type="productive-heading-04" color="primary">
              {title}
            </Text>
            <Text
              type="body-long-01"
              color="secondary"
              maxWidth={descriptionMaxWidth}
            >
              {description}
            </Text>
          </Stack>
          <slot name="actions" />
        </Stack>
      </Column>
    </Row>
  </Grid>
</section>
