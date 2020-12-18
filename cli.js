#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const meow = require('meow');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const build = require('./build');

const cli = meow(`
	Usage
	  $ create-tailwind-rn

	Options
		--config
		--outFile default: styles.json
`, {
	flags: {
		config: {
			type: 'string'
		},
		outFile: {
			type: 'string',
			default: 'styles.json'
		}
	}
});

const {config: tailwindConfigFile, outFile} = cli.flags;

const source = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

function getTailwindConfig() {
	try {
		return require(path.resolve(tailwindConfigFile || 'tailwind.config'));
	} catch (error) {
		if (error.code !== 'MODULE_NOT_FOUND') {
			throw error;
		}

		return undefined;
	}
}

/**
 * @typedef {import('./build.js').BuildContext}
 * @return {BuildContext}
 */
const getBuildContext = () => {
	const config = getTailwindConfig();

	/**
	 * @type {string[]}
	 */
	const customColors = (
		config &&
		config.theme &&
		config.theme.extend &&
		config.theme.extend.colors
	) ? (
			Object.keys(config.theme.extend.colors)
		) : (
			[]
		);

	/**
	 * @type {string[]}
	 */
	const customSpacings = (
		config &&
		config.theme &&
		config.theme.extend
	) ? (
			Object.keys({
				...config.theme.extend.spacing,
				...config.theme.extend.minHeight,
				...config.theme.extend.maxHeight,
				...config.theme.extend.minWidth,
				...config.theme.extend.maxWidth
			})
		) : (
			[]
		);

	return {customColors, customSpacings};
};

postcss([tailwind({config: tailwindConfigFile})])
	.process(source, {from: undefined})
	.then(({css}) => {
		const styles = build(css, getBuildContext());
		fs.writeFileSync(outFile, JSON.stringify(styles, null, '\t'));
	})
	.catch(error => {
		console.error('> Error occurred while generating styles');
		console.error(error.stack);
		process.exit(1);
	});
