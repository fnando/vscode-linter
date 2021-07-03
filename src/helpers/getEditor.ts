import * as vscode from "vscode";

export function getEditor(uri: vscode.Uri): vscode.TextEditor | undefined {
  return vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.path === uri.path,
  );
}
