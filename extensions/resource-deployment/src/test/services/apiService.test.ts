/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'mocha';
import { apiService } from '../../services/apiService';
import assert = require('assert');

describe('API Service Tests', function (): void {
	it('get azurecoreApi returns azure api', () => {
		const api = apiService.azurecoreApi;
		assert(api !== undefined);
	});
});
