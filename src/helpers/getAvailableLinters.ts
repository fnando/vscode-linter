import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { LinterConfig } from "vscode-linter-api";
import { Linters, Config } from "../types";
import { debug } from "./debug";

const defaultLinters: Linters = vscode.workspace
  .getConfiguration("linter")
  .inspect("linters")?.defaultValue as Linters;
const config = vscode.workspace.getConfiguration("linter") as unknown as Config;
const customExtensions = vscode.extensions.all.filter((extension) =>
  extension.id.match(/\.linter-(.+)$/),
);

const customLinters = customExtensions.reduce((buffer, extension) => {
  const [_, configName] = extension.id.split(".");
  const linterName = configName.split("-").slice(1).join("-");
  const workspaceConfig = vscode.workspace.getConfiguration(configName);
  const linterConfig = workspaceConfig.config;
  const packageJson = JSON.parse(
    fs.readFileSync(
      path.join(extension.extensionPath, "package.json"),
    ) as unknown as string,
  );

  if (!packageJson.extensionDependencies?.includes("fnando.linter")) {
    debug(
      extension.id,
      "doesn't have a dependency on fnando.linter, so skipping.",
    );

    return buffer;
  }

  buffer[linterName] = {
    ...(workspaceConfig.inspect("config")?.defaultValue as LinterConfig),
    ...linterConfig,
    importPath: path.join(extension.extensionPath, packageJson.main),
  };

  return buffer;
}, {} as Linters);

const availableLinters: Linters = Object.keys({
  ...defaultLinters,
  ...config.linters,
  ...customLinters,
}).reduce((buffer, linterName) => {
  buffer[linterName] = {
    ...defaultLinters[linterName],
    ...config.linters[linterName],
    ...customLinters[linterName],
  };

  return buffer;
}, {} as Linters);

debug(
  "available linters:",
  Object.values(availableLinters).map((linter) => linter.name),
);

export function getAvailableLinters(): Linters {
  return availableLinters;
}
