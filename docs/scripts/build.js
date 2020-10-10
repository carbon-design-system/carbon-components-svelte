const shell = require("shelljs");

shell.cd("../");
shell.exec("yarn install");
shell.exec("yarn build:css");
shell.cd("docs");
shell.exec("routify run -b");
shell.exec("svite build");
