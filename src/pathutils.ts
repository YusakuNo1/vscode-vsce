/*
 * In mono-repo, the repository looks like this:
 * 	root
 * 	|-> node_modules/
 *  |-> file1
 *  |-> file2
 * 	|-> packages/
 *      |-> package1/
 *          |-> node_modules/
 *      		|-> package3/
 *          		|-> node_modules/
 *      		|-> package4/
 *          		|-> node_modules/
 * 	    |-> package2/
 *          |-> node_modules/
 * 	    |-> vscode-ext/
 *  		|-> file1
 *          |-> node_modules/
 * 
 * After processing, all the files from all node_modules folders should be mergd. The paths should be:
 * 	root (vscode-ext)
 *  |-> file1 (from vscode-ext)
 *  |-> node_modules/
 *      |-> package1/
 *          |-> node_modules/
 *      		|-> package3/
 *          		|-> node_modules/
 *      		|-> package4/
 *          		|-> node_modules/
 *      |-> package2/
 *          |-> node_modules/
 */

export function updateFilePaths(files: any[]): any[] {
	const _files = [];
	for (const file of files) {
		const path = updatePath(file.path);
		if (path) {
			_files.push({ ...file, path });
		}
	}
	return _files;
}

function updatePath(path: string): string | null {
	const STR_NODE_MODULES = "node_modules" as const;
	const STR_EXTENSION = "extension" as const;
	const STR_PARENT_PATH = "../" as const;
	const STR_CURRENT_PACKAGE_NODE_MODULES = `${STR_EXTENSION}/${STR_NODE_MODULES}` as const;
	const STR_OTHER_PACKAGE_FOLDER = `${STR_EXTENSION}/${STR_PARENT_PATH}` as const;

	if (!path.startsWith(STR_EXTENSION)) {
		return path;
	}

	// Patterns:
	// 		extension/node_modules/**									-> keep as is
	// 		extension/node_modules/*/node_modules/**					-> keep as is
	// 		extension/[unknown-file]									-> keep as is
	// 		extension/../../node_modules/**								-> extension/node_modules/**
	// 		extension/../other-package/node_modules/**					-> extension/node_modules/**
	// 		extension/../other-package/node_modules/*/node_modules/**	-> extension/node_modules/*/node_modules/**
	// 		extension/../../[unknown-file]								-> remove the file

	if (path.includes(STR_CURRENT_PACKAGE_NODE_MODULES)) {
		return path;
	}

	if (path.includes(STR_NODE_MODULES) && path.startsWith(STR_OTHER_PACKAGE_FOLDER)) {
		const noExtensionPath = path.substring(STR_EXTENSION.length);
		const nodeModulesIndex = noExtensionPath.indexOf(STR_NODE_MODULES);
		const nodeModulesPath = noExtensionPath.substring(nodeModulesIndex);
		return `${STR_EXTENSION}/${nodeModulesPath}`;
	} else if (path.startsWith(STR_OTHER_PACKAGE_FOLDER)) {
		// Non-package files in other packages, ignore them
		return null;
	} else {
		return path;
	}
}
