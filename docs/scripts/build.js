const shell = require("shelljs");

shell.cd("../");
shell.exec("yarn");
shell.exec("yarn build:css");
shell.exec("yarn link");
shell.cd("docs");
shell.exec("yarn link 'carbon-components-svelte'");
shell.exec("yarn");
shell.exec("routify run -b");
shell.exec("svite build");
