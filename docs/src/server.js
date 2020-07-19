import sirv from "sirv";
import polka from "polka";
import * as sapper from "@sapper/server";

const { PORT, NODE_ENV } = process.env;

polka()
  .use(sirv("static", { dev: NODE_ENV === "development" }), sapper.middleware())
  .listen(PORT, (err) => {
    if (err) console.log("error", err);
  });
