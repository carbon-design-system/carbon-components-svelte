const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const NODE_ENV = process.env.NODE_ENV || "development";
const PROD = NODE_ENV === "production";

module.exports = {
  stats: "errors-only",
  mode: NODE_ENV,
  devtool: PROD ? false : "cheap-eval-source-map",
  devServer: { historyApiFallback: true },
  entry: { bundle: ["./src/index.js"] },
  resolve: {
    alias: { svelte: path.resolve("node_modules", "svelte") },
    extensions: [".mjs", ".js", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
  },
  output: { path: `${__dirname}/build`, filename: "[name].[chunkhash].js" },
  module: {
    rules: [
      {
        test: /\.(svelte)$/,
        use: {
          loader: "svelte-loader",
          options: { emitCss: true, hotReload: true },
        },
      },
      {
        test: /\.css$/,
        sideEffects: true,
        use: [
          { loader: MiniCssExtractPlugin.loader, options: { hmr: !PROD } },
          "css-loader",
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({ patterns: [{ from: "public" }] }),
    new MiniCssExtractPlugin({
      filename: PROD ? "[name].[chunkhash].css" : "[name].css",
    }),
    new OptimizeCssAssetsPlugin({}),
    new HtmlWebpackPlugin({ template: "public/index.html" }),
  ],
};
