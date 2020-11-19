<script lang="ts">
  import {
    ProgressIndicator,
    ProgressStep,
    ProgressIndicatorSkeleton,
  } from "../types";
</script>

<ProgressIndicator currentIndex="{2}">
  <ProgressStep
    complete
    label="Step 1"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    label="Step 2"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    label="Step 3"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Step 4"
    description="The progress indicator will listen for clicks on the steps"
  />
</ProgressIndicator>

<ProgressIndicator preventChangeOnClick currentIndex="{2}">
  <ProgressStep
    complete
    label="Step 1"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    label="Step 2"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    complete
    label="Step 3"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Step 4"
    description="The progress indicator will listen for clicks on the steps"
  />
</ProgressIndicator>

<ProgressIndicator spaceEqually>
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
</ProgressIndicator>

<ProgressIndicator vertical>
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
  <ProgressStep
    label="Really long label"
    description="The progress indicator will listen for clicks on the steps"
  />
</ProgressIndicator>

<ProgressIndicatorSkeleton count="{3}" />
