import { Linter, LinterConfig } from "vscode-linter-api";

export function get(linterConfig: LinterConfig): Linter {
  if (linterConfig.importPath) {
    return eval("require")(linterConfig.importPath);
  }

  return require(`./${linterConfig.name}`);
}
