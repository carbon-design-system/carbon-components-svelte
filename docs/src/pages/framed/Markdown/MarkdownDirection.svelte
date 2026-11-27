<script>
  import { Markdown } from "carbon-components-svelte";

  const source = `لتثبيت الحزمة شغّل الأمر \`npm install carbon-components-svelte\` ثم استورد الأنماط.

\`\`\`js
import "carbon-components-svelte/css/all.css";
\`\`\`

- ابدأ بمشروع جديد
- أضف المكوّنات التي تحتاجها

To install the package, run \`npm install carbon-components-svelte\`.`;
</script>

<Markdown {source} />
