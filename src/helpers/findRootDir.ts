import * as vscode from "vscode";
import * as path from "path";

export function findRootDir(uri: vscode.Uri): string {
  const rootDirUri =
    vscode.workspace.getWorkspaceFolder(uri)?.uri ||
    vscode.Uri.parse(path.resolve(uri.path, ".."));

  return rootDirUri.path;
}
