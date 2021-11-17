//@ts-check
'use strict';

const path = require("path");
const webpack = require("webpack");

/** @typedef {import('webpack').Configuration} WebpackConfig **/
/** @type WebpackConfig */
const webExtensionConfig = {
	mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
	target: "webworker", // extensions run in a webworker context
	entry: {
		extension: "./src/extension/main.web.ts", // source of the web extension main file
	},
	output: {
		filename: "[name].js",
		path: path.join(__dirname, "./artifacts/web-ext"),
		libraryTarget: "commonjs",
	},
	resolve: {
		mainFields: ["browser", "module", "main"], // look for `browser` entry point in imported node modules
		extensions: [".ts", ".js"], // support ts-files and js-files
		alias: {
			// provides alternate implementation for node module and source files
		},
		fallback: {
			// Webpack 5 no longer polyfills Node.js core modules automatically.
			// see https://webpack.js.org/configuration/resolve/#resolvefallback
			// for the list of Node.js core module polyfills.
			assert: require.resolve("assert"),
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							configFile: 'tsconfig.web.json'
						}
					},
				],
			},
		],
	},
	plugins: [
		new webpack.ProvidePlugin({
			process: "process/browser", // provide a shim for the global `process` variable
		}),
	],
	externals: {
		vscode: "commonjs vscode", // ignored because it doesn't exist
	},
	performance: {
		hints: false,
	},
	devtool: "nosources-source-map", // create a source map that points to the original source file
};
module.exports = [webExtensionConfig];
