<script lang="ts">
import { CodeSnippet } from "carbon-components-svelte";
</script>

<CodeSnippet
  type="multi"
  wrapText={true}
  code={`node -v
npm -v
yarn -v
git --version
python --version
java -version
docker --version
kubectl version`}
/>
