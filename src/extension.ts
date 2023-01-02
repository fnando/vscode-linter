import * as vscode from "vscode";
import { debounce } from "lodash";
import { LinterOffense } from "vscode-linter-api";
import { CodeActionProvider } from "./CodeActionProvider";
import { run, fix, fixInline, ignore } from "./linters/run";
import { getEditor } from "./helpers/getEditor";
import { getConfig } from "./helpers/config";
import { debug } from "./helpers/debug";

export function activate(context: vscode.ExtensionContext) {
  const config = getConfig();
  const runLinters = debounce(run, 200);
  const runFix = debounce(fix, 200);
  const runIgnore = debounce(ignore, 200);
  const { subscriptions } = context;
  const offenses: LinterOffense[] = [];
  const diagnostics = vscode.languages.createDiagnosticCollection("linter");
  const codeActionProvider = new CodeActionProvider(diagnostics, offenses);

  const handleDocument = debounce((document) => {
    runLinters(document, diagnostics, offenses);
  }, 200);

  const handleEditor = debounce((editor) => {
    if (editor) {
      runLinters(editor.document, diagnostics, offenses);
    }
  }, 200);

  // Diagnostics code ----------------------------------------------------------
  if (vscode.window.activeTextEditor) {
    runLinters(vscode.window.activeTextEditor.document, diagnostics, offenses);
  }

  subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(handleDocument),
    vscode.window.onDidChangeActiveTextEditor(handleEditor),
  );

  if (config.runOnTextChange) {
    debug("running linters on change is enabled");
    subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(handleDocument),
    );
  } else {
    debug("running linters on change is disabled");
  }

  // CodeAction code -----------------------------------------------------------
  subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", codeActionProvider),
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      "linter.fix",
      (offense: LinterOffense, type: string) => {
        const editor = getEditor(offense.uri);

        if (editor) {
          runFix(offense, editor, type);
        }
      },
    ),
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      "linter.fixInline",
      (offense: LinterOffense) => {
        const editor = getEditor(offense.uri);

        if (editor) {
          fixInline(offense, editor);
        }
      },
    ),
  );

  subscriptions.push(
    vscode.commands.registerCommand("linter.openUrl", (url: string) => {
      vscode.env.openExternal(vscode.Uri.parse(url));
    }),
  );

  subscriptions.push(
    vscode.commands.registerCommand(
      "linter.ignoreOffense",
      (offense: LinterOffense, type: string) => {
        runIgnore(offense, type);
      },
    ),
  );
}

export function deactivate() {}
