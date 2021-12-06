module.exports = {
	ignorePatterns: ["artifacts", "src/**/*.js", ".eslintrc.js"],
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	rules: {
		"no-useless-escape": "off",
		"prefer-const": "warn",
		"@typescript-eslint/no-var-requires": "off",
		// https://github.com/typescript-eslint/typescript-eslint/issues/2621
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],
	},
	env: {
		browser: true,
		node: true,
	},
};
