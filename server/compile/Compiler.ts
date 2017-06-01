import * as ts from 'typescript';

export function compile(fileNames: string[], options: ts.CompilerOptions) {
	let program = ts.createProgram(fileNames, options);
	// console.log(program.getRootFileNames());
	// console.log(program.getSourceFiles());
	let emitResult = program.emit();

	let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	allDiagnostics.forEach(diagnostic => {
		console.log(diagnostic);
		let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
		let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
		console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
	});

	let success = !emitResult.emitSkipped;

	return success;
}