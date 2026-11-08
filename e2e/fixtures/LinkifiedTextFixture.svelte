<script>
  import { LinkifiedText } from "carbon-components-svelte";
</script>

<p data-testid="english">
  <LinkifiedText
    text="Track it at https://shipping.example.com/track/1Z999AA1. Questions? Write to support@example.com or see www.example.com/help (open 9 to 5)."
    target="_blank"
  />
</p>

<p data-testid="hostile">
  <LinkifiedText
    text={'Click <a href="javascript:alert(1)">here</a>, javascript://%0Aalert(1) or https://paypal.com@evil.example/'}
  />
</p>

<p data-testid="hebrew" dir="rtl">
  <LinkifiedText text="שלום, הנה הקישור https://example.com/docs. תודה!" />
</p>

<p data-testid="lookalike">
  <LinkifiedText text="Log in at https://аррӏе.com/login now." />
</p>
