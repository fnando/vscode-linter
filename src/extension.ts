import * as vscode from "vscode";
import { debounce } from "lodash";
import { LinterOffense } from "vscode-linter-api";
import { CodeActionProvider } from "./CodeActionProvider";
import { run, fix, ignore } from "./linters/run";
import { getEditor } from "./helpers/getEditor";

export function activate(context: vscode.ExtensionContext) {
  const runLinters = debounce(run, 200);
  const runFix = debounce(fix, 200);
  const runIgnore = debounce(ignore, 200);
  const { subscriptions } = context;
  const offenses: LinterOffense[] = [];
  const diagnostics = vscode.languages.createDiagnosticCollection("linter");
  const codeActionProvider = new CodeActionProvider(diagnostics, offenses);

  // Diagnostics code ----------------------------------------------------------
  if (vscode.window.activeTextEditor) {
    runLinters(vscode.window.activeTextEditor.document, diagnostics, offenses);
  }

  subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        runLinters(editor.document, diagnostics, offenses);
      }
    }),
  );

  subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      runLinters(document, diagnostics, offenses);
    }),
  );

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
