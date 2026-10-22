<script lang="ts">
  import Text from "carbon-components-svelte/Text/Text.svelte";

  export let truncatedType: "body-01" | "body-02" = "body-01";
  export let truncatedStyle: string | undefined = undefined;
</script>

<Text>Default body</Text>
<Text tag="h1" type="heading-04">Heading</Text>
<Text color="secondary">Secondary text</Text>
<Text type="code-01" color="error" class="custom">Code</Text>
<Text tag="span">Inline span</Text>
<Text tag="span" type="inherit" color="error">Inherited type</Text>
<Text color="helper">Color only</Text>
<Text color="success">Success text</Text>
<Text color="link">Link text</Text>
<Text type="body-01" weight="semibold">Semibold text</Text>
<Text type="body-01" italic>Italic text</Text>
<Text type="body-01" family="mono">Mono text</Text>
<Text type="body-compact-01" wrap="break-word">Break word text</Text>
<Text type="body-compact-01" wrap="nowrap">Nowrap text</Text>
<Text tag="h2" type="heading-04" balance>Balanced heading</Text>
<Text type="body-02" pretty>Pretty-wrapped paragraph</Text>
<Text type="body-01" maxWidth={320}>Max width px</Text>
<Text type="body-01" maxWidth="38ch">Max width ch</Text>
<Text type="body-01" fullWidth>Full width text</Text>
<Text
  type="body-01"
  weight="semibold"
  color="primary"
  maxWidth="42ch"
  class="combined"
  >Combined modifiers</Text
>
<Text type={truncatedType} style={truncatedStyle} lines={3}
  >Truncated text</Text
>
