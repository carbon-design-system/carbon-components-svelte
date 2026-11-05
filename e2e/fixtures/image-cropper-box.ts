import ImageCropperFixture from "./ImageCropperFixture.svelte";
import { mount } from "./mount";

// Box mode with a free ratio, for the layout sweep, which opens a page
// without a query.
history.replaceState(null, "", "?mode=box&aspect=free&grid=always");
mount(ImageCropperFixture);
