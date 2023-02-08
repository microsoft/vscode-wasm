/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';

interface Package {
	name: string;
	location: string;
	dependsOn?: { kind: 'dev' | 'release'; package: Package }[];
}

const syncApiCommon: Package = {
	name: '@vscode/sync-api-common',
	location: './sync-api-common'
};

const syncApiClient: Package = {
	name: '@vscode/sync-api-client',
	location: './sync-api-client',
	dependsOn: [
		{ kind: 'release', package: syncApiCommon },
	]
};

const syncApiTests: Package = {
	name: '@vscode/sync-api-tests',
	location: './sync-api-tests',
	dependsOn: [
	]
};

const syncApiService: Package = {
	name: '@vscode/sync-api-service',
	location: './sync-api-service',
	dependsOn: [
		{ kind: 'release', package: syncApiCommon },
	]
};

const wasmWasi: Package = {
	name: '@vscode/wasm-wasi',
	location: './wasm-wasi',
	dependsOn: [
		{ kind: 'release', package: syncApiClient }
	]
};

const wasmWasiTests: Package = {
	name: '@vscode/wasm-wasi-tests',
	location: './wasm-wasi-tests',
	dependsOn: [
		{ kind: 'release', package: syncApiClient }
	]
};

const packages: Package[] = [syncApiCommon, syncApiClient, syncApiService, syncApiTests, wasmWasi, wasmWasiTests];
const root = path.join(__dirname, '..', '..');

interface ValidationEntry {
	package: Package;
	version: string;
	violations: {
		package: Package;
		version: string;
	}[];
}

const validations: Map<string, ValidationEntry> = new Map();

function check(): void {
	for (const pack of packages) {
		const json = require(path.join(root, pack.location, 'package.json'));
		validations.set(pack.name, { package: pack, version: json.version, violations: []});
		if (pack.dependsOn !== undefined) {
			for (const dependency of pack.dependsOn) {
				const version = dependency.kind === 'release'
					? json.dependencies[dependency.package.name]
					: json.devDependencies[dependency.package.name];
				const validationEntry = validations.get(dependency.package.name)!;
				if (version === undefined) {
					validationEntry.violations.push({ package: pack, version: 'undefined'});
				} else if (version !== validationEntry.version) {
					validationEntry.violations.push({ package: pack, version: version });
				}
			}
		}
	}
}

function printResult(): void {
	for (const entry of validations.values()) {
		if (entry.violations.length === 0) {
			continue;
		}
		process.exitCode = 1;
		process.stdout.write(`Package ${entry.package.name} at version ${entry.version} is incorrectly referenced in the following packages:\n`);
		for (const violation of entry.violations) {
			process.stdout.write(`\t ${violation.package.name} with version ${violation.version}\n`);
		}
	}
}

check();
printResult();