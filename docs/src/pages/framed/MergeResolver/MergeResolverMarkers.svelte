<script>
  import { MergeResolver, Stack, Text } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  // The file as git leaves it after a failed merge, with `merge.conflictStyle`
  // set to `diff3` so each conflict also shows the common ancestor.
  const conflicted = `{
  "name": "checkout",
  "flags": {
<<<<<<< HEAD
    "newCart": true,
    "expressPay": false
||||||| merged common ancestors
    "newCart": false,
    "expressPay": false
=======
    "newCart": false,
    "expressPay": true
>>>>>>> release/1.5
  },
  "region": "us-south"
}
`;

  let result = "";
  let remaining = 0;
</script>

<Stack gap={5}>
  <MergeResolver
    {conflicted}
    bind:result
    language="json"
    {tokenize}
    height="22rem"
    on:change={(e) => (remaining = e.detail.remaining)}
  />
  <Text
    >{remaining} conflicts left in the file. The result is {result.length} characters.</Text
  >
</Stack>
