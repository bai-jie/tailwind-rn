'use strict';
const css = require('css');
const cssToReactNative = require('css-to-react-native').default;

const remToPx = value => `${Number.parseFloat(value) * 16}px`;

const getStyles = rule => {
	const styles = rule.declarations
		.filter(({property, value}) => {
			// Skip line-height utilities without units
			if (property === 'line-height' && !value.endsWith('rem')) {
				return false;
			}

			return true;
		})
		.map(({property, value}) => {
			if (value.endsWith('rem')) {
				return [property, remToPx(value)];
			}

			return [property, value];
		});

	return cssToReactNative(styles);
};

const supportedUtilities = [
	// Flexbox
	/^flex/,
	/^items-/,
	/^content-/,
	/^justify-/,
	/^self-/,
	// Display
	'hidden',
	'overflow-hidden',
	'overflow-visible',
	'overflow-scroll',
	// Position
	'absolute',
	'relative',
	// Top, right, bottom, left
	/^(inset-0|inset-x-0|inset-y-0)/,
	/^(top|bottom|left|right)-0$/,
	// Z Index
	/^z-\d+$/,
	// Padding
	/^(p.?-\d+|p.?-px)/,
	// Margin
	/^-?(m.?-\d+|m.?-px)/,
	// Width
	/^w-(\d|\/)+|^w-px|^w-full/,
	// Height
	/^(h-\d+|h-px|h-full)/,
	// Min/Max width/height
	/^(min-w-|max-w-|min-h-|max-h-)/,
	// Font size
	/^text-/,
	// Font style
	/^(not-)?italic$/,
	// Font weight
	/^font-(hairline|thin|light|normal|medium|semibold|bold|extrabold|black)/,
	// Letter spacing
	/^tracking-/,
	// Line height
	/^leading-\d+/,
	// Text align, color, opacity
	/^text-/,
	// Text transform
	'uppercase',
	'lowercase',
	'capitalize',
	'normal-case',
	// Background color
	/^bg-(transparent|black|white|gray|red|orange|yellow|green|teal|blue|indigo|purple|pink)/,
	// Background opacity
	/^bg-opacity-/,
	// Border color, style, width, radius, opacity
	/^(border|rounded)/,
	// Opacity
	/^opacity-/,
	// Pointer events
	/^pointer-events-/
];

/**
 * @typedef {Object} BuildContext
 * @property {string[]} [customColors] - Custom colors provided in tailwind.config. Default: []
 * @property {string[]} [customSpacings] - Custom spacings provided in tailwind.config. Default: []
 */

/**
 * @param {BuildContext} [context={}] - context provided in tailwind.config
 * @return {boolean}
 */
const isUtilitySupported = (utility, context = {}) => {
	const customColors = context.customColors || [];
	const customSpacings = context.customSpacings || [];

	// Skip utilities with `currentColor` values
	// Skip utilities with vh units
	if (
		['border-current', 'text-current', 'max-h-screen', 'min-h-screen'].includes(
			utility
		)
	) {
		return false;
	}

	const allSupportedUtilities = [
		...supportedUtilities,
		// ## customColors
		new RegExp(`^bg-(${customColors.join('|')})`),
		// ## customSpacings
		// Padding
		new RegExp(`^p.?-(${customSpacings.join('|')})`),
		// Margin
		new RegExp(`^-?m.?-(${customSpacings.join('|')})`),
		// Width (supportedUtilities already include min-width, max-width)
		new RegExp(`^w-(${customSpacings.join('|')})`),
		// Height/min-height/max-height
		new RegExp(`^(min-|max-)?h-(${customSpacings.join('|')})`),
	];

	for (const supportedUtility of allSupportedUtilities) {
		if (typeof supportedUtility === 'string' && supportedUtility === utility) {
			return true;
		}

		if (supportedUtility instanceof RegExp && supportedUtility.test(utility)) {
			return true;
		}
	}

	return false;
};

/**
 * @param source {String} CSS
 * @param {BuildContext} [context={}] - context provided in tailwind.config
 */
module.exports = (source, context = {}) => {
	const {stylesheet} = css.parse(source);

	// Mapping of Tailwind class names to React Native styles
	const styles = {};

	for (const rule of stylesheet.rules) {
		if (rule.type === 'rule') {
			for (const selector of rule.selectors) {
				const utility = selector.replace(/^\./, '').replace('\\/', '/');

				if (isUtilitySupported(utility, context)) {
					styles[utility] = getStyles(rule);
				}
			}
		}
	}

	// Additional styles that we're not able to parse correctly automatically
	styles.underline = {textDecorationLine: 'underline'};
	styles['line-through'] = {textDecorationLine: 'line-through'};
	styles['no-underline'] = {textDecorationLine: 'none'};

	return styles;
};
