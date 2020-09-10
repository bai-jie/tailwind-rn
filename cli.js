#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const meow = require('meow');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const build = require('./build');

meow(`
	Usage
	  $ create-tailwind-rn
`);

const source = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

/**
 * @typedef {import('./build.js').BuildContext}
 * @return {BuildContext}
 */
const getBuildContext = () => {
	/**
	 * @type {string[]}
	 */
	let customColors = [], customSpacings = [];
	try {
		const config = require(path.resolve('tailwind.config'));

		if (
			config &&
			config.theme &&
			config.theme.extend &&
			config.theme.extend.colors
		) {
			customColors = Object.keys(config.theme.extend.colors);
		}

		// customSpacings
		if (
			config &&
			config.theme &&
			config.theme.extend
		) {
			customSpacings = Object.keys(Object.assign(
				{},
				config.theme.extend.spacing,
				config.theme.extend.minHeight,
				config.theme.extend.maxHeight,
				config.theme.extend.minWidth,
				config.theme.extend.maxWidth,
			));
		}
	} catch (error) {
		if (error.code !== 'MODULE_NOT_FOUND') {
			throw error;
		}
	}

	return { customColors, customSpacings };
};

postcss([tailwind])
	.process(source, {from: undefined})
	.then(({css}) => {
		const styles = build(css, getBuildContext());
		fs.writeFileSync('styles.json', JSON.stringify(styles, null, '\t'));
	})
	.catch(error => {
		console.error('> Error occurred while generating styles');
		console.error(error.stack);
		process.exit(1);
	});
