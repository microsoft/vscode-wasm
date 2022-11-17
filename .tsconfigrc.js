/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

// @ts-check
'use strict';

const { CompilerOptions } = require('@vscode/tsconfig-gen');

/**
 * @typedef {import('@vscode/tsconfig-gen').SharableOptions} SharableOptions
 * @typedef {import('@vscode/tsconfig-gen').ProjectDescription} ProjectDescription
 * @typedef {import('@vscode/tsconfig-gen').ProjectOptions} ProjectOptions
 * @typedef {import('@vscode/tsconfig-gen').Projects} Projects
 */

/**
 * Creates a publish project description from a normal project description by removing
 * any project reference from it since it has to come via a npm dependency during publish.
 *
 * @param {ProjectDescription} projectDescription The project description
 * @returns {ProjectDescription} The project description without project references
 */
function createPublishProjectDescription(projectDescription) {
	const result = Object.assign({}, projectDescription);
	delete result.references;
	return result
}

/** @type SharableOptions */
const general = {
	/**
	 * Even under browser we compile to node and commonjs and
	 * rely on esbuild to package everything correctly.
	 */
	compilerOptions: {
		module: "Node16",
		moduleResolution: "Node16",
		target: 'es2020',
		lib: [ 'es2020' ],
	}
};

/** @type SharableOptions */
const testMixin = {
	compilerOptions: {
		types: ['mocha']
	}
};

/** @type SharableOptions */
const vscodeMixin = {
	compilerOptions: {
		types: ['vscode']
	}
};

/** @type SharableOptions */
const common = {
	extends: [ general ],
	compilerOptions: {
		rootDir: '.'
	},
	include: ['.']
};

/** @type SharableOptions */
const browser = {
	extends: [ general ],
	compilerOptions: {
		rootDir: '.',
		types: [],
		lib: [ 'webworker' ]
	},
	include: ['.']
};

/** @type SharableOptions */
const node = {
	extends: [ general ],
	compilerOptions: {
		rootDir: '.',
		types: ['node']
	},
	include: ['.']
};

/** @type SharableOptions */
const referenced = {
	compilerOptions: {
		composite: true
	},
};

/** @type SharableOptions */
const testbedOptions = {
	compilerOptions: {
		rootDir: ".",
		skipLibCheck: true,
		lib: [ "es2020", "webworker"],
		types: ["node", "vscode"],
		module: "Node16",
		moduleResolution: "Node16",
		outDir: "./out"
	}
};

/** @type ProjectDescription */
const sync_api_common = {
	name: 'sync-api-common',
	path: './sync-api-common',
	out: {
		dir: './lib',
		buildInfoFile: '${buildInfoFile}.tsbuildInfo'
	},
	sourceFolders: [
		{
			path: './src/common',
			extends: [ common ],
			exclude: [ 'test' ],
		},
		{
			path: './src/common/test',
			extends: [ common, testMixin ],
			references: [ '..' ]
		},
		{
			path: './src/browser',
			extends: [ browser ],
			exclude: [ 'test' ],
			references: [ '../common' ]
		},
		{
			path: './src/browser/test',
			extends: [ browser, testMixin ],
			references: [ '../../common/test', '..' ]
		},
		{
			path: './src/node',
			extends: [ node ],
			exclude: [ 'test' ],
			references: [ '../common' ]
		},
		{
			path: './src/node/test',
			extends: [ node, testMixin ],
			references: [ '../../common/test', '..' ]
		}
	]
};

/** @type ProjectDescription */
const sync_api_client = {
	name: 'sync-api-client',
	path: './sync-api-client',
	extends: [ common, referenced ],
	out: {
		dir: './lib',
		buildInfoFile: '${buildInfoFile}.tsbuildInfo'
	},
	compilerOptions: {
		rootDir: './src'
	},
	references: [
		sync_api_common
	]
};

/** @type ProjectDescription */
const sync_api_service = {
	name: 'sync-api-service',
	path: './sync-api-service',
	extends: [ common, vscodeMixin, referenced ],
	out: {
		dir: './lib',
		buildInfoFile: '${buildInfoFile}.tsbuildInfo'
	},
	compilerOptions: {
		rootDir: './src'
	},
	references: [
		sync_api_common
	]
};

/** @type ProjectDescription */
const sync_api_tests = {
	name: 'sync-api-tests',
	path: './sync-api-tests',
	extends: [ common, vscodeMixin, testMixin ],
	out: {
		dir: './lib',
		buildInfoFile: '${buildInfoFile}.tsbuildInfo'
	},
	compilerOptions: {
		rootDir: './src'
	},
	references: [
		sync_api_client, sync_api_service
	]
};

/** @type ProjectDescription */
const wasm_wasi = {
	name: 'wasm-wasi',
	path: './wasm-wasi',
	out: {
		dir: './lib',
		buildInfoFile: '${buildInfoFile}.tsbuildInfo'
	},
	sourceFolders: [
		{
			path: './src/common',
			extends: [ common ]
		},
		{
			path: './src/browser',
			extends: [ browser ],
			references: [ '../common' ]
		},
		{
			path: './src/node',
			extends: [ node ],
			references: [ '../common' ]
		}
	],
	references: [
		sync_api_client
	]
};

/** @type ProjectDescription */
const testbed_coreutils = {
	name: "coreutils",
	path: './testbeds/coreutils',
	extends: [ testbedOptions ],
	out:  {
		dir: './out'
	}
}

/** @type ProjectDescription */
const testbed_cpp = {
	name: "cpp",
	path: './testbeds/cpp',
	extends: [ testbedOptions ],
	out:  {
		dir: './out'
	}
}

/** @type ProjectDescription */
const testbed_python = {
	name: "python",
	path: './testbeds/python',
	extends: [ testbedOptions ],
	out:  {
		dir: './out'
	}
}

/** @type ProjectDescription */
const testbed_rust = {
	name: "rust",
	path: './testbeds/rust',
	extends: [ testbedOptions ],
	out:  {
		dir: './out'
	}
}

/** @type ProjectDescription */
const testbeds = {
	name: 'testbeds',
	path: './testbeds',
	references: [ testbed_coreutils, testbed_cpp, testbed_python, testbed_rust ]
}

/** @type ProjectDescription */
const root = {
	name: 'root',
	path: './',
	references: [ sync_api_common, sync_api_client, sync_api_service, sync_api_tests, wasm_wasi ]
};

/** @type CompilerOptions */
const defaultCompilerOptions = {
	strict: true,
	noImplicitAny: true,
	noImplicitReturns: true,
	noImplicitThis: true,
	declaration: true,
	stripInternal: true
};

/** @type CompilerOptions */
const compileCompilerOptions = CompilerOptions.assign(defaultCompilerOptions, {
	sourceMap: true,
	noUnusedLocals: true,
	noUnusedParameters: true,
});

/** @type ProjectOptions */
const compileProjectOptions = {
	tags: ['compile'],
	tsconfig: 'tsconfig.json',
	variables: new Map([['buildInfoFile', 'compile']]),
	compilerOptions: compileCompilerOptions
};

/** @type CompilerOptions */
const watchCompilerOptions = CompilerOptions.assign(defaultCompilerOptions, {
	sourceMap: true,
	noUnusedLocals: false,
	noUnusedParameters: false,
	assumeChangesOnlyAffectDirectDependencies: true,
});

/** @type ProjectOptions */
const watchProjectOptions = {
	tags: ['watch'],
	tsconfig: 'tsconfig.watch.json',
	variables: new Map([['buildInfoFile', 'watch']]),
	compilerOptions: watchCompilerOptions
};

/** @type CompilerOptions */
const publishCompilerOptions = CompilerOptions.assign(defaultCompilerOptions, {
	sourceMap: false,
	noUnusedLocals: true,
	noUnusedParameters: true,
});

/** @type ProjectOptions */
const publishProjectOptions = {
	tags: ['publish'],
	tsconfig: 'tsconfig.publish.json',
	variables: new Map([['buildInfoFile', 'publish']]),
	compilerOptions: publishCompilerOptions
};

/** @type Projects */
const projects = [
	[ sync_api_common, [ compileProjectOptions, watchProjectOptions ] ],
	[ createPublishProjectDescription(sync_api_common), [ publishProjectOptions] ],
	[ sync_api_client, [ compileProjectOptions, watchProjectOptions ] ],
	[ createPublishProjectDescription(sync_api_client), [ publishProjectOptions ] ],
	[ sync_api_service, [ compileProjectOptions, watchProjectOptions ] ],
	[ createPublishProjectDescription(sync_api_service), [ publishProjectOptions ] ],
	[ sync_api_tests, [ compileProjectOptions, watchProjectOptions ] ],
	[ createPublishProjectDescription(sync_api_tests), [ publishProjectOptions ] ],
	[ wasm_wasi, [ compileProjectOptions, watchProjectOptions ] ],
	[ createPublishProjectDescription(wasm_wasi), [ publishProjectOptions ] ],
	[ root, [compileProjectOptions, watchProjectOptions ] ],
	[ testbed_coreutils, [ compileProjectOptions ] ],
	[ testbed_cpp, [ compileProjectOptions ] ],
	[ testbed_python, [ compileProjectOptions ] ],
	[ testbed_rust, [ compileProjectOptions ] ],
	[ testbeds, [ compileProjectOptions ] ]
];

module.exports = projects;