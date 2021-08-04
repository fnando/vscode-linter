import * as vscode from "vscode";
import * as childProcess from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as linters from ".";
import { Linter, LinterConfig, LinterOffense } from "vscode-linter-api";
import { Config, Linters } from "../types.d";
import { getAvailableLinters } from "../helpers/getAvailableLinters";
import { expandCommand } from "../helpers/expandCommand";
import { getLinterConfig } from "../helpers/getLinterConfig";
import { getEditor } from "../helpers/getEditor";
import { getIndent } from "../helpers/getIndent";
import { debug } from "../helpers/debug";
import { findRootDir } from "../helpers/findRootDir";
import { md5 } from "../helpers/md5";
import * as cache from "../helpers/cache";

function convertOffenseToDiagnostic(offense: LinterOffense): vscode.Diagnostic {
  return {
    code: offense.code,
    source: offense.source,
    message: offense.message,
    range: new vscode.Range(
      new vscode.Position(offense.lineStart, offense.columnStart),
      new vscode.Position(offense.lineEnd, offense.columnEnd),
    ),
    severity: offense.severity as unknown as vscode.DiagnosticSeverity,
  };
}

function getCacheFilePath(
  linterName: string,
  document: vscode.TextDocument,
): string {
  return path.join(os.tmpdir(), linterName, md5(document.uri.path));
}

function setDiagnosticsFromCache({
  document,
  matchingLinters,
  diagnosticCollection,
}: {
  diagnosticCollection: vscode.DiagnosticCollection;
  document: vscode.TextDocument;
  matchingLinters: string[];
}) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let linterName of matchingLinters) {
    const cacheFilePath = getCacheFilePath(linterName, document);

    try {
      diagnostics.push(
        ...((cache.read(cacheFilePath) ?? []) as LinterOffense[]).map(
          (offense) => convertOffenseToDiagnostic(offense),
        ),
      );
    } catch (error) {
      debug("Error while reading", cacheFilePath);
    }
  }

  debug(
    `setting "${document.uri.path}" diagnostics from cache:`,
    diagnostics.length,
  );

  diagnosticCollection.set(document.uri, diagnostics);
}

function replaceDiagnosticsBySource({
  source,
  offenses,
  document,
  diagnosticCollection,
}: {
  source: string;
  diagnosticCollection: vscode.DiagnosticCollection;
  document: vscode.TextDocument;
  offenses: LinterOffense[];
}) {
  const diagnostics = diagnosticCollection
    .get(document.uri)
    ?.filter((diagnostic) => diagnostic.source !== source);

  diagnostics?.push(
    ...offenses.map((offense) => convertOffenseToDiagnostic(offense)),
  );

  diagnosticCollection.set(document.uri, diagnostics);
}

function setFreshDiagnostics({
  document,
  matchingLinters,
  availableLinters,
  diagnosticCollection,
  offenses,
}: {
  diagnosticCollection: vscode.DiagnosticCollection;
  document: vscode.TextDocument;
  matchingLinters: string[];
  availableLinters: Linters;
  offenses: LinterOffense[];
}) {
  for (let linterName of matchingLinters) {
    const linterConfig = availableLinters[linterName];

    if (!linterConfig.enabled) {
      debug(`${linterName}`, "linter is disabled, so skipping.");
      continue;
    }

    const config = vscode.workspace.getConfiguration(
      "linter",
    ) as unknown as Config;
    const cacheFilePath = getCacheFilePath(linterName, document);
    const contents = document.getText();
    const rootDir = findRootDir(document.uri);
    const configFile = findConfigFile(document.uri, linterConfig.configFiles);

    const command = expandCommand(linterConfig, {
      $rootDir: rootDir,
      $file: document.uri.path,
      $extension: path.extname(document.uri.path).toLowerCase(),
      $extensionBare: path.extname(document.uri.path).toLowerCase().substr(1),
      $config: configFile,
      $debug: config.debug,
      $lint: true,
      $language: document.languageId,
    });

    if (command.length === 0) {
      continue;
    }

    debug({
      rootDir,
      configFile,
      command,
    });

    const started = Date.now();

    const _offenses = lint({
      rootDir,
      command,
      uri: document.uri,
      input: contents,
      linter: linters.get(linterConfig),
    });

    const ended = Date.now();

    debug(`${linterConfig.name}'s command took`, `${ended - started}ms`);

    offenses.push(..._offenses);
    cache.write(cacheFilePath, _offenses);
    replaceDiagnosticsBySource({
      source: linterConfig.name,
      document,
      diagnosticCollection,
      offenses: _offenses,
    });
  }
}

export async function run(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection,
  offenses: LinterOffense[],
) {
  if (["code-runner-output"].includes(document.languageId)) {
    return;
  }

  const availableLinters = getAvailableLinters();
  const matchingLinters = Object.keys(availableLinters).filter(
    (name) =>
      availableLinters[name].languages.includes(document.languageId) &&
      availableLinters[name].enabled,
  );

  if (!matchingLinters.length) {
    debug("No linters found for", JSON.stringify(document.languageId));
  }

  offenses.length = 0;
  diagnosticCollection.clear();

  const cacheEnabled = (
    vscode.workspace.getConfiguration("linter") as unknown as Config
  ).cache;

  debug("Reading from cache?", cacheEnabled);

  if (cacheEnabled) {
    setDiagnosticsFromCache({
      document,
      matchingLinters,
      diagnosticCollection,
    });
  }

  setTimeout(
    () =>
      setFreshDiagnostics({
        offenses,
        document,
        matchingLinters,
        availableLinters,
        diagnosticCollection,
      }),
    0,
  );
}

function findConfigFile(uri: vscode.Uri, configFiles: string[]): string {
  if (!configFiles.length) {
    return "";
  }

  const dirs = uri.path.split("/").slice(0, -1);

  while (dirs.length > 0) {
    for (let candidate of configFiles) {
      const configFile = path.resolve(dirs.join("/"), candidate);

      if (fs.existsSync(configFile)) {
        return configFile;
      }
    }

    dirs.pop();
  }

  return "";
}

function isBinWithinPath(bin: string): boolean {
  const dirs = process.env.PATH?.split(":").filter(Boolean) ?? [];

  return dirs.some((dir) => {
    try {
      return (
        fs.accessSync(path.join(dir, bin), fs.constants.X_OK) === undefined
      );
    } catch (error) {
      return false;
    }
  });
}

function lint({
  uri,
  input,
  rootDir,
  linter,
  command,
}: {
  uri: vscode.Uri;
  input: string;
  rootDir: string;
  linter: Linter;
  command: string[];
}): LinterOffense[] {
  let result: childProcess.SpawnSyncReturns<Buffer>;

  try {
    if (!command[0].includes("/") && !isBinWithinPath(command[0])) {
      debug(
        `The ${command[0]} binary couldn't be found within $PATH:`,
        process.env.PATH?.split(":").filter(Boolean),
      );

      return [];
    }

    result = childProcess.spawnSync(command[0], command.slice(1), {
      input,
      env: process.env,
      cwd: rootDir,
    });

    if (result.error) {
      debug(`Error while running "${command[0]}":`, result.error.message);
      return [];
    }

    const params = {
      uri,
      stdout: result.stdout?.toString() ?? "",
      stderr: result.stderr?.toString() ?? "",
      status: result.status ?? 0,
    };

    return linter.getOffenses(params);
  } catch (error) {
    debug(error);
    debug(
      "command exited with",
      `status=${result!.status}, signal=${result!.signal}`,
    );
    debug(result!.stderr?.toString() || result!.stdout?.toString());
    return [];
  }
}

export function fixInline(offense: LinterOffense, editor: vscode.TextEditor) {
  if (!offense.inlineFix) {
    debug("Tried to inline fix, but offense has no fix", offense);
    return;
  }

  const { inlineFix } = offense;
  let range: vscode.Range;

  if ("offset" in inlineFix) {
    const start = editor.document.positionAt(inlineFix.offset[0]);
    const end = editor.document.positionAt(inlineFix.offset[1]);
    range = new vscode.Range(start, end);
  } else {
    range = new vscode.Range(
      new vscode.Position(inlineFix.start.line, inlineFix.start.column),
      new vscode.Position(inlineFix.end.line, inlineFix.end.column),
    );
  }

  editor.edit((change) => change.replace(range, inlineFix.replacement));
}

export function fix(
  offense: LinterOffense,
  editor: vscode.TextEditor,
  type: string,
) {
  const input = editor.document.getText();
  const rootDir = findRootDir(offense.uri);
  const linterConfig = getLinterConfig(offense.source);
  const configFile = findConfigFile(offense.uri, linterConfig.configFiles);
  const command = expandCommand(linterConfig, {
    $rootDir: rootDir,
    $file: offense.uri.path,
    $extension: path.extname(offense.uri.path).toLowerCase(),
    $extensionBare: path.extname(offense.uri.path).toLowerCase().substr(1),
    $code: offense.code,
    $fixAll: type === "fix-all",
    $fixOne: type === "fix-one",
    $fixCategory: type === "fix-category",
    $config: configFile,
    $debug: vscode.workspace.getConfiguration("linter").debug,
    $language: editor.document.languageId,
  });
  const linter: Linter = linters.get(linterConfig);

  if (!linter.parseFixOutput) {
    debug(linterConfig.name, "didn't implement `parseFixOutput(params)`");

    return;
  }

  try {
    const result = childProcess.spawnSync(command[0], command.slice(1), {
      input,
      env: process.env,
      cwd: rootDir,
    });

    editor.edit((change) => {
      const firstLine = editor.document.lineAt(0);
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
      const range = new vscode.Range(firstLine.range.start, lastLine.range.end);

      change.replace(
        range,
        linter.parseFixOutput!({
          input,
          stdout: result.stdout.toString(),
          stderr: result.stderr.toString(),
        }),
      );
    });
  } catch (error) {
    debug(error);
  }
}

export function ignore(offense: LinterOffense, type: string) {
  const linterConfig: LinterConfig = getLinterConfig(offense.source);
  const linter: Linter = linters.get(linterConfig);
  const editor = getEditor(offense.uri);

  const funcs = {
    "ignore-eol": "getIgnoreEolPragma(params)",
    "ignore-file": "getIgnoreFilePragma(params)",
    "ignore-line": "getIgnoreLinePragma(params)",
  };

  const passed = {
    "ignore-eol": Boolean(linter.getIgnoreEolPragma),
    "ignore-file": Boolean(linter.getIgnoreFilePragma),
    "ignore-line": Boolean(linter.getIgnoreLinePragma),
  };

  if (!editor) {
    return;
  }

  if (!passed[type as keyof typeof passed]) {
    debug(
      linterConfig.name,
      "didn't implement the function",
      `"${funcs[type as keyof typeof funcs]}"`,
    );
    return;
  }

  let line: vscode.TextLine;
  let replacement: string | undefined = undefined;

  if (type === "ignore-eol") {
    line = editor.document.lineAt(offense.lineStart);
    replacement = linter.getIgnoreEolPragma!({
      line: { text: line.text, number: offense.lineStart },
      code: offense.code,
    });
  }

  if (type === "ignore-file") {
    line = editor.document.lineAt(0);
    const indent = getIndent(line.text);
    replacement = linter.getIgnoreFilePragma!({
      line: { text: line.text, number: 0 },
      code: offense.code,
      indent,
    });
  }

  if (type === "ignore-line") {
    line = editor.document.lineAt(Math.max(0, offense.lineStart - 1));
    const indent = getIndent(editor.document.lineAt(offense.lineStart).text);
    replacement = linter.getIgnoreLinePragma!({
      line: { number: offense.lineStart, text: line.text },
      code: offense.code,
      indent,
    });
  }

  if (replacement === undefined) {
    debug(linterConfig.name, "didn't return a replacement fix.");

    return;
  }

  editor.edit((change) => change.replace(line.range, replacement!));
}
