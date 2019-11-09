/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isUndefinedOrNull } from 'vs/base/common/types';
import { equalsIgnoreCase } from 'vs/base/common/strings';

/**
 * Converts HTML characters inside the string to use entities instead. Makes the string safe from
 * being used e.g. in HTMLElement.innerHTML.
 */
export function escape(html: string): string {
	return html.replace(/[<|>|&|"]/g, function (match) {
		switch (match) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&amp;';
			case '"': return '&quot;';
			case '\'': return '&#39';
			default: return match;
		}
	});
}

// gotten from https://github.com/59naga/string-raw/blob/master/src/index.js
export function raw(callSite: any, ...substitutions: any[]): string {
	let template;
	try {
		template = Array.from(callSite.raw);
	} catch (e) {
		throw new TypeError('Cannot convert undefined or null to object');
	}

	return template.map((chunk, i) => {
		if (callSite.raw.length <= i) {
			return chunk;
		}
		return substitutions[i - 1] ? substitutions[i - 1] + chunk : chunk;
	}).join('');
}

/**
 * Tests is a and b are equal value (including if both are undefined)
 */
export function areIffyStringsEqual(a: string | undefined | null, b: string | undefined | null): boolean {
	const aUndefined = isUndefinedOrNull(a);
	const bUndefined = isUndefinedOrNull(b);
	return (aUndefined && bUndefined) || (!aUndefined && !bUndefined ? equalsIgnoreCase(a, b) : false);
}
